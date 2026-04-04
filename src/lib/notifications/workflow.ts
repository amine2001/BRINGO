import type { OrderStatus } from "@/lib/db";
import type { OrderLifecycleMetadata } from "@/lib/redash";

import { clampNonNegative, normalizeStatus, resolveEpochMs } from "./utils";
import type { TimeLike } from "./types";

const ACCEPTANCE_GRACE_MS = 3 * 60 * 1000;
const REMINDER_INTERVAL_MS = 2 * 60 * 1000;
const DEFAULT_PREPARATION_MINUTES = 2;

export type NotificationWorkflowStage =
  | "waiting_acceptance"
  | "preparation_overdue"
  | "delivery_alert";

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

function isDeliveredStatus(status: OrderStatus | null | undefined) {
  return normalizeStatus(status) === "delivered";
}

export function evaluateNotificationWorkflow(
  lifecycle: OrderLifecycleMetadata,
  state: NotificationWorkflowState,
): NotificationWorkflowEvaluation {
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

  if (isDeliveredStatus(state.status)) {
    return {
      stage: null,
      shouldSendInitial: false,
      shouldSendReminder: false,
      resetReminderState: remindersSent > 0 || lastReminderSentAt !== null,
      reminderCount: 0,
      nextReminderAt: null,
      overdueMinutes: null,
      expectedPreparationMinutes: lifecycle.expected_preparation_minutes,
      productCount: lifecycle.product_count ?? lifecycle.final_product_count,
    };
  }

  let stage: NotificationWorkflowStage | null = null;
  let dueAt: number | null = null;

  if (currentStatus === "new" && !lifecycle.accepted_at) {
    stage = "waiting_acceptance";
    dueAt = createdAtMs + ACCEPTANCE_GRACE_MS;
  } else if (currentStatus === "accepted" && !lifecycle.preparation_ended_at) {
    const acceptedAtMs = resolveEpochMs(lifecycle.accepted_at ?? state.createdAt, createdAtMs);
    const expectedPreparationMinutes =
      lifecycle.expected_preparation_minutes ?? DEFAULT_PREPARATION_MINUTES;
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
      expectedPreparationMinutes: lifecycle.expected_preparation_minutes,
      productCount: lifecycle.product_count ?? lifecycle.final_product_count,
    };
  }

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
      nextReminderAt: isDue ? nowMs + REMINDER_INTERVAL_MS : dueAt,
      overdueMinutes: isDue ? Math.max(0, Math.floor((nowMs - dueAt) / 60_000)) : null,
      expectedPreparationMinutes: lifecycle.expected_preparation_minutes,
      productCount: lifecycle.product_count ?? lifecycle.final_product_count,
    };
  }

  const shouldSendReminder =
    isDue &&
    (!normalizedLastReminderSentAt ||
      nowMs >= normalizedLastReminderSentAt + REMINDER_INTERVAL_MS);

  return {
    stage,
    shouldSendInitial: false,
    shouldSendReminder,
    resetReminderState,
    reminderCount: shouldSendReminder ? normalizedRemindersSent + 1 : normalizedRemindersSent,
    nextReminderAt: !isDue
      ? dueAt
      : shouldSendReminder
        ? nowMs + REMINDER_INTERVAL_MS
        : (normalizedLastReminderSentAt ?? nowMs) + REMINDER_INTERVAL_MS,
    overdueMinutes: isDue ? Math.max(0, Math.floor((nowMs - dueAt) / 60_000)) : null,
    expectedPreparationMinutes: lifecycle.expected_preparation_minutes,
    productCount: lifecycle.product_count ?? lifecycle.final_product_count,
  };
}
