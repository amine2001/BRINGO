import { normalizeStatus } from "./utils";
import type { NotificationDraft, OrderSnapshot } from "./types";

function formatDelay(delayMinutes?: number | null): string {
  if (!Number.isFinite(Number(delayMinutes))) return "";
  const value = Number(delayMinutes);
  return value > 0 ? `\nDelay: ${value} min` : "";
}

export function buildInitialAlert(snapshot: OrderSnapshot): Omit<NotificationDraft, "sendAt" | "stopAfterSend"> {
  return {
    kind: "initial",
    dedupeKey: `initial:${snapshot.orderId}`,
    sequence: 1,
    title: "New order",
    message:
      `NEW ORDER\n` +
      `Store: ${snapshot.storeName}\n` +
      `Type: ${snapshot.deliveryType}\n` +
      `Order ID: ${snapshot.orderId}\n` +
      `Status: ${normalizeStatus(snapshot.status).toUpperCase() || "NEW"}` +
      formatDelay(snapshot.delayMinutes),
  };
}

export function buildReminderAlert(snapshot: OrderSnapshot, sequence: number, remainingCount: number): Omit<NotificationDraft, "sendAt" | "stopAfterSend"> {
  return {
    kind: "reminder",
    dedupeKey: `reminder:${snapshot.orderId}:${sequence}`,
    sequence,
    title: sequence === 1 ? "Order reminder" : `Order reminder #${sequence}`,
    message:
      `ORDER REMINDER\n` +
      `Store: ${snapshot.storeName}\n` +
      `Type: ${snapshot.deliveryType}\n` +
      `Order ID: ${snapshot.orderId}\n` +
      `Status: ${normalizeStatus(snapshot.status).toUpperCase() || "NEW"}\n` +
      `Remaining reminders: ${Math.max(0, remainingCount)}` +
      formatDelay(snapshot.delayMinutes),
  };
}

export function buildStatusChangeAlert(
  snapshot: OrderSnapshot,
  previousStatus: string | null | undefined,
): Omit<NotificationDraft, "sendAt" | "stopAfterSend"> {
  const current = normalizeStatus(snapshot.status).toUpperCase() || "UNKNOWN";
  const previous = normalizeStatus(previousStatus).toUpperCase() || "UNKNOWN";

  return {
    kind: "status-change",
    dedupeKey: `status-change:${snapshot.orderId}:${normalizeStatus(snapshot.status)}`,
    sequence: 1,
    title: "Order status changed",
    message:
      `STATUS CHANGE\n` +
      `Store: ${snapshot.storeName}\n` +
      `Type: ${snapshot.deliveryType}\n` +
      `Order ID: ${snapshot.orderId}\n` +
      `From: ${previous}\n` +
      `To: ${current}` +
      formatDelay(snapshot.delayMinutes),
  };
}
