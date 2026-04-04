export type TimeLike = number | string | Date | null | undefined;

export type OrderStatus = "new" | "accepted" | "prepared" | "delivered" | string;

export type NotificationKind = "initial" | "reminder" | "status-change";

export type NotificationStopReason =
  | "accepted"
  | "delivered"
  | "repeat-limit"
  | "duplicate"
  | "not-due"
  | null;

export interface OrderSnapshot {
  orderId: string;
  storeName: string;
  deliveryType: string;
  status: OrderStatus;
  createdAt: TimeLike;
  delayMinutes?: number | null;
}

export interface NotificationPolicy {
  repeatCount: number;
  intervalSeconds: number;
  stopWhenAccepted?: boolean;
  stopWhenDelivered?: boolean;
  sendInitialAlert?: boolean;
  sendStatusChangeAlerts?: boolean;
}

export interface NotificationHistoryItem {
  dedupeKey: string;
  kind: NotificationKind;
  sentAt: number;
  sequence?: number;
  status?: string;
}

export interface NotificationState {
  initialSentAt?: number | null;
  lastReminderSentAt?: number | null;
  remindersSent?: number;
  lastNotifiedStatus?: string | null;
}

export interface NotificationContext {
  now?: TimeLike;
  policy: NotificationPolicy;
  history?: NotificationHistoryItem[];
  state?: NotificationState;
  previousSnapshot?: Pick<OrderSnapshot, "status"> | null;
}

export interface NotificationDraft {
  kind: NotificationKind;
  dedupeKey: string;
  sequence: number;
  title: string;
  message: string;
  sendAt: number;
  stopAfterSend: boolean;
}

export interface NotificationEvaluation {
  shouldSendNow: boolean;
  notificationsToSend: NotificationDraft[];
  remainingCount: number;
  nextNotificationAt: number | null;
  stopReason: NotificationStopReason;
  duplicateKeys: string[];
}
