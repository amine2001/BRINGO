import {
  buildInitialAlert,
  buildReminderAlert,
  buildStatusChangeAlert,
} from "./messages";
import type {
  NotificationContext,
  NotificationDraft,
  NotificationEvaluation,
  NotificationHistoryItem,
  NotificationPolicy,
  NotificationState,
  OrderSnapshot,
  TimeLike,
} from "./types";
import {
  clampNonNegative,
  isAcceptedStatus,
  isDeliveredStatus,
  isTerminalStatus,
  normalizeStatus,
  resolveEpochMs,
  uniqueStrings,
} from "./utils";

function normalizePolicy(policy: NotificationPolicy) {
  return {
    repeatCount: clampNonNegative(policy.repeatCount),
    intervalSeconds: clampNonNegative(policy.intervalSeconds),
    stopWhenAccepted: policy.stopWhenAccepted !== false,
    stopWhenDelivered: policy.stopWhenDelivered !== false,
    sendInitialAlert: policy.sendInitialAlert !== false,
    sendStatusChangeAlerts: policy.sendStatusChangeAlerts !== false,
  };
}

function getHistoryKeys(history: NotificationHistoryItem[] | undefined): Set<string> {
  return new Set((history ?? []).map((entry) => entry.dedupeKey));
}

function normalizeState(state: NotificationState | undefined): Required<NotificationState> {
  return {
    initialSentAt: state?.initialSentAt ?? null,
    lastReminderSentAt: state?.lastReminderSentAt ?? null,
    remindersSent: clampNonNegative(state?.remindersSent ?? 0),
    lastNotifiedStatus: state?.lastNotifiedStatus ?? null,
  };
}

function buildReminderDraft(
  snapshot: OrderSnapshot,
  policy: ReturnType<typeof normalizePolicy>,
  state: Required<NotificationState>,
  nowMs: number,
): NotificationDraft | null {
  if (state.remindersSent >= policy.repeatCount) {
    return null;
  }

  const anchor = state.lastReminderSentAt ?? state.initialSentAt;
  if (!anchor) return null;

  const nextAt = anchor + policy.intervalSeconds * 1000;
  if (nowMs < nextAt) return null;

  const sequence = state.remindersSent + 1;
  const draft = buildReminderAlert(snapshot, sequence, policy.repeatCount - sequence);

  return {
    ...draft,
    sendAt: nowMs,
    stopAfterSend: false,
  };
}

function buildInitialDraft(snapshot: OrderSnapshot, nowMs: number): NotificationDraft {
  const draft = buildInitialAlert(snapshot);
  return {
    ...draft,
    sendAt: nowMs,
    stopAfterSend: false,
  };
}

function buildStatusChangeDraft(
  snapshot: OrderSnapshot,
  previousSnapshot: Pick<OrderSnapshot, "status"> | null | undefined,
  nowMs: number,
): NotificationDraft {
  const draft = buildStatusChangeAlert(snapshot, previousSnapshot?.status);
  return {
    ...draft,
    sendAt: nowMs,
    stopAfterSend: isTerminalStatus(snapshot.status),
  };
}

function shouldStopForStatus(
  policy: ReturnType<typeof normalizePolicy>,
  snapshot: OrderSnapshot,
): NotificationEvaluation["stopReason"] {
  if (policy.stopWhenDelivered && isDeliveredStatus(snapshot.status)) return "delivered";
  if (policy.stopWhenAccepted && isAcceptedStatus(snapshot.status)) return "accepted";
  return null;
}

export function evaluateOrderNotifications(
  snapshot: OrderSnapshot,
  context: NotificationContext,
): NotificationEvaluation {
  const nowMs = resolveEpochMs(context.now);
  const policy = normalizePolicy(context.policy);
  const state = normalizeState(context.state);
  const historyKeys = getHistoryKeys(context.history);
  const normalizedStatus = normalizeStatus(snapshot.status);

  const duplicateKeys: string[] = [];
  const notificationsToSend: NotificationDraft[] = [];
  const stopReason = shouldStopForStatus(policy, snapshot);

  const initialDraft = buildInitialDraft(snapshot, nowMs);
  const initialAlreadySent =
    historyKeys.has(initialDraft.dedupeKey) ||
    Boolean(state.initialSentAt);

  if (policy.sendInitialAlert && !stopReason && !initialAlreadySent) {
    notificationsToSend.push(initialDraft);
  } else if (policy.sendInitialAlert && initialAlreadySent) {
    duplicateKeys.push(initialDraft.dedupeKey);
  }

  const statusChanged =
    Boolean(context.previousSnapshot) &&
    normalizeStatus(context.previousSnapshot?.status) !== normalizedStatus;

  if (policy.sendStatusChangeAlerts && statusChanged) {
    const statusDraft = buildStatusChangeDraft(snapshot, context.previousSnapshot, nowMs);
    if (historyKeys.has(statusDraft.dedupeKey) || state.lastNotifiedStatus === normalizedStatus) {
      duplicateKeys.push(statusDraft.dedupeKey);
    } else {
      notificationsToSend.push(statusDraft);
    }
  }

  const reminderDraft = buildReminderDraft(snapshot, policy, state, nowMs);
  if (reminderDraft) {
    if (historyKeys.has(reminderDraft.dedupeKey)) {
      duplicateKeys.push(reminderDraft.dedupeKey);
    } else if (!stopReason) {
      notificationsToSend.push(reminderDraft);
    }
  }

  const projectedReminderCount = state.remindersSent + (reminderDraft ? 1 : 0);
  const remainingCount = stopReason ? 0 : Math.max(0, policy.repeatCount - projectedReminderCount);
  const reminderAnchor = reminderDraft
    ? reminderDraft.sendAt
    : state.lastReminderSentAt ?? state.initialSentAt ?? (notificationsToSend.some((draft) => draft.kind === "initial") ? nowMs : null);
  const nextNotificationAt = stopReason || projectedReminderCount >= policy.repeatCount || !reminderAnchor
    ? null
    : reminderAnchor + policy.intervalSeconds * 1000;
  const shouldSendNow = notificationsToSend.length > 0;

  return {
    shouldSendNow,
    notificationsToSend,
    remainingCount,
    nextNotificationAt,
    stopReason,
    duplicateKeys: uniqueStrings(duplicateKeys),
  };
}

export function getInitialNotification(snapshot: OrderSnapshot, now: TimeLike = Date.now()) {
  return {
    ...buildInitialAlert(snapshot),
    sendAt: resolveEpochMs(now),
    stopAfterSend: false,
  } satisfies NotificationDraft;
}

export function getReminderNotification(
  snapshot: OrderSnapshot,
  sequence: number,
  remainingCount: number,
  now: TimeLike = Date.now(),
) {
  return {
    ...buildReminderAlert(snapshot, sequence, remainingCount),
    sendAt: resolveEpochMs(now),
    stopAfterSend: false,
  } satisfies NotificationDraft;
}

export function getStatusChangeNotification(
  snapshot: OrderSnapshot,
  previousStatus: string | null | undefined,
  now: TimeLike = Date.now(),
) {
  return {
    ...buildStatusChangeAlert(snapshot, previousStatus),
    sendAt: resolveEpochMs(now),
    stopAfterSend: isTerminalStatus(snapshot.status),
  } satisfies NotificationDraft;
}
