import { describe, expect, it } from "vitest";
import {
  evaluateOrderNotifications,
  getInitialNotification,
  getReminderNotification,
  getStatusChangeNotification,
} from "../src/lib/notifications/engine";
import type {
  NotificationContext,
  NotificationHistoryItem,
  NotificationPolicy,
  NotificationState,
  OrderSnapshot,
} from "../src/lib/notifications/types";

const baseSnapshot: OrderSnapshot = {
  orderId: "ORD-123",
  storeName: "Carrefour Ain Sebaa",
  deliveryType: "EXPRESS",
  status: "new",
  createdAt: "2026-04-03T10:00:00Z",
  delayMinutes: 18,
};

const basePolicy: NotificationPolicy = {
  repeatCount: 3,
  intervalSeconds: 300,
  stopWhenAccepted: true,
  stopWhenDelivered: true,
  sendInitialAlert: true,
  sendStatusChangeAlerts: true,
};

function makeContext(overrides: Partial<NotificationContext> = {}): NotificationContext {
  return {
    now: "2026-04-03T10:10:00Z",
    policy: basePolicy,
    ...overrides,
  };
}

describe("notifications engine", () => {
  it("builds stable notification drafts for each notification kind", () => {
    const initial = getInitialNotification(baseSnapshot, "2026-04-03T10:10:00Z");
    const reminder = getReminderNotification(baseSnapshot, 2, 1, "2026-04-03T10:15:00Z");
    const statusChange = getStatusChangeNotification(baseSnapshot, "accepted", "2026-04-03T10:20:00Z");

    expect(initial.dedupeKey).toBe("initial:ORD-123");
    expect(reminder.dedupeKey).toBe("reminder:ORD-123:2");
    expect(statusChange.dedupeKey).toBe("status-change:ORD-123:new");
    expect(initial.sendAt).toBe(new Date("2026-04-03T10:10:00Z").getTime());
    expect(reminder.stopAfterSend).toBe(false);
    expect(statusChange.stopAfterSend).toBe(false);
  });

  it("stops reminders at the configured repeat limit", () => {
    const state: NotificationState = {
      initialSentAt: Date.parse("2026-04-03T10:00:00Z"),
      lastReminderSentAt: Date.parse("2026-04-03T10:05:00Z"),
      remindersSent: 3,
      lastNotifiedStatus: "new",
    };

    const result = evaluateOrderNotifications(baseSnapshot, makeContext({ state }));

    expect(result.stopReason).toBeNull();
    expect(result.notificationsToSend).toHaveLength(0);
    expect(result.remainingCount).toBe(0);
    expect(result.nextNotificationAt).toBeNull();
  });

  it("does not duplicate reminders or status changes without a new state transition", () => {
    const history: NotificationHistoryItem[] = [
      {
        kind: "reminder",
        dedupeKey: "reminder:ORD-123:1",
        sentAt: Date.parse("2026-04-03T10:05:00Z"),
        sequence: 1,
      },
    ];

    const state: NotificationState = {
      initialSentAt: Date.parse("2026-04-03T10:00:00Z"),
      lastReminderSentAt: Date.parse("2026-04-03T10:05:00Z"),
      remindersSent: 0,
      lastNotifiedStatus: "new",
    };

    const result = evaluateOrderNotifications(
      { ...baseSnapshot, status: "new" },
      makeContext({
        history,
        state,
        previousSnapshot: { status: "new" },
      }),
    );

    expect(result.duplicateKeys).toContain("reminder:ORD-123:1");
    expect(result.notificationsToSend).toHaveLength(0);
    expect(result.shouldSendNow).toBe(false);
  });

  it("stops reminders when the order is accepted or delivered and the policy requires it", () => {
    const acceptedState: NotificationState = {
      initialSentAt: Date.parse("2026-04-03T10:00:00Z"),
      lastReminderSentAt: Date.parse("2026-04-03T10:05:00Z"),
      remindersSent: 1,
    };

    const acceptedResult = evaluateOrderNotifications(
      { ...baseSnapshot, status: "accepted" },
      makeContext({ state: acceptedState }),
    );

    expect(acceptedResult.stopReason).toBe("accepted");
    expect(acceptedResult.notificationsToSend).toHaveLength(0);
    expect(acceptedResult.nextNotificationAt).toBeNull();

    const deliveredResult = evaluateOrderNotifications(
      { ...baseSnapshot, status: "delivered" },
      makeContext({ state: acceptedState }),
    );

    expect(deliveredResult.stopReason).toBe("delivered");
    expect(deliveredResult.notificationsToSend).toHaveLength(0);
    expect(deliveredResult.nextNotificationAt).toBeNull();
  });

  it("sends status-change notifications only when the status actually changes", () => {
    const result = evaluateOrderNotifications(
      { ...baseSnapshot, status: "prepared" },
      makeContext({
        policy: {
          ...basePolicy,
          sendInitialAlert: false,
        },
        previousSnapshot: { status: "prepared" },
        state: {
          initialSentAt: Date.parse("2026-04-03T10:00:00Z"),
          remindersSent: 0,
          lastNotifiedStatus: "prepared",
        },
      }),
    );

    expect(result.notificationsToSend.find((draft) => draft.kind === "status-change")).toBeUndefined();
    expect(result.duplicateKeys).toHaveLength(0);
  });

  it("does not send an initial notification when the first observed status is terminal", () => {
    const result = evaluateOrderNotifications(
      { ...baseSnapshot, status: "delivered" },
      makeContext({
        state: {
          initialSentAt: null,
          lastReminderSentAt: null,
          remindersSent: 0,
          lastNotifiedStatus: null,
        },
      }),
    );

    expect(result.stopReason).toBe("delivered");
    expect(result.notificationsToSend).toHaveLength(0);
    expect(result.shouldSendNow).toBe(false);
  });
});
