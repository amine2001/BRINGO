import { describe, expect, it } from "vitest";

import { evaluateNotificationWorkflow } from "../src/lib/notifications/workflow";
import type { OrderLifecycleMetadata } from "../src/lib/redash/types";

const emptyLifecycle: OrderLifecycleMetadata = {
  accepted_at: null,
  preparation_ended_at: null,
  product_count: null,
  final_product_count: null,
  delivery_state: null,
  picker_state: null,
  delivery_alert_active: false,
  expected_preparation_minutes: null,
};

describe("notification workflow", () => {
  it("starts acceptance reminders after three minutes", () => {
    const result = evaluateNotificationWorkflow(emptyLifecycle, {
      createdAt: "2026-04-04T10:00:00Z",
      status: "new",
      now: "2026-04-04T10:04:00Z",
      initialSentAt: "2026-04-04T10:01:00Z",
      lastReminderSentAt: null,
      remindersSent: 0,
      previousStatus: "new",
    });

    expect(result.stage).toBe("waiting_acceptance");
    expect(result.shouldSendReminder).toBe(true);
    expect(result.reminderCount).toBe(1);
    expect(result.overdueMinutes).toBe(1);
  });

  it("calculates preparation overdue using two minutes per product", () => {
    const result = evaluateNotificationWorkflow(
      {
        ...emptyLifecycle,
        accepted_at: new Date("2026-04-04T10:05:00Z"),
        product_count: 5,
        expected_preparation_minutes: 10,
      },
      {
        createdAt: "2026-04-04T10:00:00Z",
        status: "accepted",
        now: "2026-04-04T10:16:30Z",
        initialSentAt: "2026-04-04T10:01:00Z",
        lastReminderSentAt: null,
        remindersSent: 0,
        previousStatus: "accepted",
      },
    );

    expect(result.stage).toBe("preparation_overdue");
    expect(result.shouldSendReminder).toBe(true);
    expect(result.expectedPreparationMinutes).toBe(10);
    expect(result.productCount).toBe(5);
    expect(result.overdueMinutes).toBe(1);
  });

  it("repeats delivery alert notifications every two minutes until completion", () => {
    const activeResult = evaluateNotificationWorkflow(
      {
        ...emptyLifecycle,
        preparation_ended_at: new Date("2026-04-04T10:15:00Z"),
        delivery_state: "alert",
        delivery_alert_active: true,
      },
      {
        createdAt: "2026-04-04T10:00:00Z",
        status: "prepared",
        now: "2026-04-04T10:20:00Z",
        initialSentAt: "2026-04-04T10:01:00Z",
        lastReminderSentAt: "2026-04-04T10:17:30Z",
        remindersSent: 1,
        previousStatus: "prepared",
      },
    );

    const clearedResult = evaluateNotificationWorkflow(
      {
        ...emptyLifecycle,
        preparation_ended_at: new Date("2026-04-04T10:15:00Z"),
        delivery_state: "complete",
      },
      {
        createdAt: "2026-04-04T10:00:00Z",
        status: "delivered",
        now: "2026-04-04T10:20:00Z",
        initialSentAt: "2026-04-04T10:01:00Z",
        lastReminderSentAt: "2026-04-04T10:17:30Z",
        remindersSent: 1,
        previousStatus: "prepared",
      },
    );

    expect(activeResult.stage).toBe("delivery_alert");
    expect(activeResult.shouldSendReminder).toBe(true);
    expect(activeResult.reminderCount).toBe(2);
    expect(clearedResult.stage).toBeNull();
    expect(clearedResult.resetReminderState).toBe(true);
  });
});
