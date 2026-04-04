import type { OrderStatus, TimeLike } from "./types";

export const DEFAULT_REMAINING_COUNT = 0;

export function resolveEpochMs(value: TimeLike, fallback = Date.now()): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function normalizeStatus(status: OrderStatus | null | undefined): string {
  return String(status ?? "")
    .trim()
    .toLowerCase();
}

export function isAcceptedStatus(status: OrderStatus | null | undefined): boolean {
  return normalizeStatus(status) === "accepted";
}

export function isDeliveredStatus(status: OrderStatus | null | undefined): boolean {
  return normalizeStatus(status) === "delivered";
}

export function isTerminalStatus(status: OrderStatus | null | undefined): boolean {
  return isAcceptedStatus(status) || isDeliveredStatus(status);
}

export function clampNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
