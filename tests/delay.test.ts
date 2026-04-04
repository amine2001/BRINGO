import { describe, expect, it } from "vitest";
import {
  buildDelayAlertKey,
  clearDelayAlertEmission,
  evaluateDelayAlert,
  InMemoryDelayAlertLedger,
  registerDelayAlertEmission,
  shouldEvaluateDelayAlert,
} from "../src/lib/delay";
import type { DelayAlertSettings, DelayAlertSourceOrder } from "../src/lib/delay/types";

const baseOrder: DelayAlertSourceOrder = {
  companyId: "company-1",
  orderId: "ORD-123",
  storeId: "store-1",
  storeName: "Carrefour Ain Sebaa",
  deliveryType: "EXPRESS",
  status: "new",
  delayMinutes: 18,
  createdAt: "2026-04-03T10:00:00Z",
  updatedAt: "2026-04-03T10:10:00Z",
};

const settings: DelayAlertSettings = {
  enabled: true,
  delayThresholdMinutes: 15,
  telegramAdminChatId: "-100000000",
};

describe("delay alert engine", () => {
  it("builds a deterministic alert key", () => {
    expect(
      buildDelayAlertKey({
        companyId: " company-1 ",
        storeId: " store-1 ",
        orderId: "ORD-123",
        deliveryType: "express",
        thresholdMinutes: 15.9,
      }),
    ).toBe("delay-alert:company-1:store-1:ORD-123:EXPRESS:15");
  });

  it("emits a delay alert once and then dedupes until the repeat window expires", async () => {
    const ledger = new InMemoryDelayAlertLedger();
    const emittedAt = new Date("2026-04-03T10:00:00Z");

    const firstDecision = await evaluateDelayAlert(baseOrder, settings, ledger, {
      now: emittedAt,
      repeatAfterMs: 5 * 60 * 1000,
    });

    expect(firstDecision.shouldSend).toBe(true);
    await registerDelayAlertEmission(firstDecision, ledger, emittedAt);

    const secondDecision = await evaluateDelayAlert(baseOrder, settings, ledger, {
      now: new Date("2026-04-03T10:03:00Z"),
      repeatAfterMs: 5 * 60 * 1000,
    });

    expect(secondDecision.shouldSend).toBe(false);
    expect(secondDecision.reason).toBe("deduped");

    const thirdDecision = await evaluateDelayAlert(baseOrder, settings, ledger, {
      now: new Date("2026-04-03T10:04:00Z"),
      repeatAfterMs: 5 * 60 * 1000,
    });

    expect(thirdDecision.shouldSend).toBe(false);
    expect(thirdDecision.reason).toBe("deduped");
    expect(thirdDecision.dedupeUntil).toBe("2026-04-03T10:05:00.000Z");
  });

  it("suppresses terminal statuses and clears prior alert state", async () => {
    const ledger = new InMemoryDelayAlertLedger();
    const alertKey = buildDelayAlertKey({
      companyId: baseOrder.companyId,
      storeId: baseOrder.storeId,
      orderId: baseOrder.orderId,
      deliveryType: baseOrder.deliveryType,
      thresholdMinutes: settings.delayThresholdMinutes,
    });

    ledger.set({
      key: alertKey,
      emittedAt: "2026-04-03T10:00:00.000Z",
      delayMinutes: 18,
      thresholdMinutes: 15,
    });

    expect(shouldEvaluateDelayAlert({ ...baseOrder, status: "delivered" }, settings)).toBe(false);

    const decision = await evaluateDelayAlert(
      { ...baseOrder, status: "delivered" },
      settings,
      ledger,
      { now: new Date("2026-04-03T10:15:00Z") },
    );

    expect(decision.shouldSend).toBe(false);
    expect(decision.reason).toBe("terminal-status");
    expect(ledger.get(alertKey)).toBeNull();

    await clearDelayAlertEmission(decision, ledger);
    expect(ledger.get(alertKey)).toBeNull();
  });

  it("does not emit when the delay is below threshold or disabled", async () => {
    const belowThreshold = await evaluateDelayAlert(
      { ...baseOrder, delayMinutes: 10 },
      settings,
    );

    const disabled = await evaluateDelayAlert(
      baseOrder,
      { ...settings, enabled: false },
    );

    expect(belowThreshold.shouldSend).toBe(false);
    expect(belowThreshold.reason).toBe("below-threshold");
    expect(disabled.shouldSend).toBe(false);
    expect(disabled.reason).toBe("disabled");
  });
});
