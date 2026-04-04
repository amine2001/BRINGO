import type { OrderStatus } from "@/lib/db";
import type { OrderLifecycleMetadata } from "@/lib/redash";

import { clampNonNegative, normalizeStatus, resolveEpochMs } from "./utils";
import type { TimeLike } from "./types";

export const DEFAULT_NOTIFICATION_WORKFLOW_CONFIG = {
  acceptanceGraceMinutes: 3,
  acceptanceReminderIntervalMinutes: 2,
  preparationMinutesPerProduct: 2,
  preparationReminderIntervalMinutes: 2,
  deliveryAlertReminderIntervalMinutes: 2,
} as const;

export type NotificationWorkflowStage =
  | "waiting_acceptance"
  | "preparation_overdue"
  | "delivery_alert";

export interface NotificationWorkflowConfig {
  acceptanceGraceMinutes: number;
  acceptanceReminderIntervalMinutes: number;
  preparationMinutesPerProduct: number;
  preparationReminderIntervalMinutes: number;
  deliveryAlertReminderIntervalMinutes: number;
}

export interface NotificationWorkflowState {
  createdAt: TimeLike;
  status: OrderStatus;
  now?: TimeLike;
  initialSentAt?: TimeLike;
  lastReminderSentAt?: TimeLike;
  remindersSent?: number;
  previousStatus?: string | null;
}

export interface NotificationWorkflowEvaluation {
  stage: NotificationWorkflowStage | null;
  shouldSendInitial: boolean;
  shouldSendReminder: boolean;
  resetReminderState: boolean;
  reminderCount: number;
  nextReminderAt: number | null;
  overdueMinutes: number | null;
  expectedPreparationMinutes: number | null;
  productCount: number | null;
}

function clampPositiveMinutes(value: number | null | undefined, fallback: number) {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) {
    return fallback;
  }

  return Math.max(1, Math.trunc(value as number));
}

function isDeliveredStatus(status: OrderStatus | null | undefined) {
  return normalizeStatus(status) === "delivered";
}

function resolvePreparationProductCount(lifecycle: OrderLifecycleMetadata) {
  const count = lifecycle.product_count ?? lifecycle.final_product_count;
  return count && count > 0 ? Math.trunc(count) : 1;
}

function resolveReminderIntervalMs(
  stage: NotificationWorkflowStage,
  config: NotificationWorkflowConfig,
) {
  const minutes =
    stage === "waiting_acceptance"
      ? config.acceptanceReminderIntervalMinutes
      : stage === "preparation_overdue"
        ? config.preparationReminderIntervalMinutes
        : config.deliveryAlertReminderIntervalMinutes;

  return minutes * 60 * 1000;
}

export function resolveNotificationWorkflowConfig(
  config?: Partial<NotificationWorkflowConfig> | null,
): NotificationWorkflowConfig {
  return {
    acceptanceGraceMinutes: clampPositiveMinutes(
      config?.acceptanceGraceMinutes,
      DEFAULT_NOTIFICATION_WORKFLOW_CONFIG.acceptanceGraceMinutes,
    ),
    acceptanceReminderIntervalMinutes: clampPositiveMinutes(
      config?.acceptanceReminderIntervalMinutes,
      DEFAULT_NOTIFICATION_WORKFLOW_CONFIG.acceptanceReminderIntervalMinutes,
    ),
    preparationMinutesPerProduct: clampPositiveMinutes(
      config?.preparationMinutesPerProduct,
      DEFAULT_NOTIFICATION_WORKFLOW_CONFIG.preparationMinutesPerProduct,
    ),
    preparationReminderIntervalMinutes: clampPositiveMinutes(
      config?.preparationReminderIntervalMinutes,
      DEFAULT_NOTIFICATION_WORKFLOW_CONFIG.preparationReminderIntervalMinutes,
    ),
    deliveryAlertReminderIntervalMinutes: clampPositiveMinutes(
      config?.deliveryAlertReminderIntervalMinutes,
      DEFAULT_NOTIFICATION_WORKFLOW_CONFIG.deliveryAlertReminderIntervalMinutes,
    ),
  };
}

export function evaluateNotificationWorkflow(
  lifecycle: OrderLifecycleMetadata,
  state: NotificationWorkflowState,
  config?: Partial<NotificationWorkflowConfig> | null,
): NotificationWorkflowEvaluation {
  const resolvedConfig = resolveNotificationWorkflowConfig(config);
  const nowMs = resolveEpochMs(state.now);
  const createdAtMs = resolveEpochMs(state.createdAt, nowMs);
  const initialSentAt = state.initialSentAt ? resolveEpochMs(state.initialSentAt) : null;
  const lastReminderSentAt = state.lastReminderSentAt
    ? resolveEpochMs(state.lastReminderSentAt)
    : null;
  const remindersSent = clampNonNegative(state.remindersSent ?? 0);
  const currentStatus = normalizeStatus(state.status);
  const previousStatus = normalizeStatus(state.previousStatus);
  const statusChanged = previousStatus !== "" && previousStatus !== currentStatus;
  const shouldSendInitial = !initialSentAt && !isDeliveredStatus(state.status);
  const productCount = lifecycle.product_count ?? lifecycle.final_product_count;
  const expectedPreparationMinutes =
    resolvePreparationProductCount(lifecycle) * resolvedConfig.preparationMinutesPerProduct;

  if (isDeliveredStatus(state.status)) {
    return {
      stage: null,
      shouldSendInitial: false,
      shouldSendReminder: false,
      resetReminderState: remindersSent > 0 || lastReminderSentAt !== null,
      reminderCount: 0,
      nextReminderAt: null,
      overdueMinutes: null,
      expectedPreparationMinutes,
      productCount,
    };
  }

  let stage: NotificationWorkflowStage | null = null;
  let dueAt: number | null = null;

  if (currentStatus === "new" && !lifecycle.accepted_at) {
    stage = "waiting_acceptance";
    dueAt = createdAtMs + resolvedConfig.acceptanceGraceMinutes * 60 * 1000;
  } else if (currentStatus === "accepted" && !lifecycle.preparation_ended_at) {
    const acceptedAtMs = resolveEpochMs(lifecycle.accepted_at ?? state.createdAt, createdAtMs);
    stage = "preparation_overdue";
    dueAt = acceptedAtMs + expectedPreparationMinutes * 60 * 1000;
  } else if (currentStatus === "prepared" && lifecycle.delivery_alert_active) {
    stage = "delivery_alert";
    dueAt = nowMs;
  }

  if (!stage || dueAt === null) {
    return {
      stage: null,
      shouldSendInitial,
      shouldSendReminder: false,
      resetReminderState: remindersSent > 0 || lastReminderSentAt !== null,
      reminderCount: 0,
      nextReminderAt: null,
      overdueMinutes: null,
      expectedPreparationMinutes,
      productCount,
    };
  }

  const reminderIntervalMs = resolveReminderIntervalMs(stage, resolvedConfig);
  const resetReminderState = statusChanged;
  const normalizedLastReminderSentAt = resetReminderState ? null : lastReminderSentAt;
  const normalizedRemindersSent = resetReminderState ? 0 : remindersSent;
  const isDue = nowMs >= dueAt;

  if (shouldSendInitial) {
    return {
      stage,
      shouldSendInitial: true,
      shouldSendReminder: false,
      resetReminderState,
      reminderCount: normalizedRemindersSent,
      nextReminderAt: isDue ? nowMs + reminderIntervalMs : dueAt,
      overdueMinutes: isDue ? Math.max(0, Math.floor((nowMs - dueAt) / 60_000)) : null,
      expectedPreparationMinutes,
      productCount,
    };
  }

  const shouldSendReminder =
    isDue &&
    (!normalizedLastReminderSentAt ||
      nowMs >= normalizedLastReminderSentAt + reminderIntervalMs);

  return {
    stage,
    shouldSendInitial: false,
    shouldSendReminder,
    resetReminderState,
    reminderCount: shouldSendReminder ? normalizedRemindersSent + 1 : normalizedRemindersSent,
    nextReminderAt: !isDue
      ? dueAt
      : shouldSendReminder
        ? nowMs + reminderIntervalMs
        : (normalizedLastReminderSentAt ?? nowMs) + reminderIntervalMs,
    overdueMinutes: isDue ? Math.max(0, Math.floor((nowMs - dueAt) / 60_000)) : null,
    expectedPreparationMinutes,
    productCount,
  };
}
