import type { DeliveryType, OrderStatus } from "@/lib/db";

import type { NormalizedOrderRecord, OrderLifecycleMetadata } from "./types";

type LooseRecord = Record<string, unknown>;

const ORDER_ID_KEYS = ["order_id", "orderid", "id", "order_number", "numero_commande"];
const STORE_KEYS = ["store_name", "store", "magasin", "storeName"];
const DELIVERY_TYPE_KEYS = ["delivery_type", "deliveryType", "type_livraison", "type"];
const STATUS_KEYS = ["status", "order_status", "etat", "state"];
const CREATED_AT_KEYS = [
  "created_at",
  "createdAt",
  "order_created_at",
  "order_date",
  "date_creation",
  "checkout_completed_at",
];
const DELAY_KEYS = ["delay_minutes", "delay", "retard", "delay_min", "delayMinutes"];
const ACCEPTED_AT_KEYS = [
  "accepted_at",
  "date_d_acceptation_prep",
  "date_acceptation_prep",
  "accepted_preparation_at",
];
const PREPARATION_ENDED_AT_KEYS = [
  "order_preparation_end",
  "preparation_end",
  "prepared_at",
];
const PRODUCT_COUNT_KEYS = ["number_of_products", "product_count", "products_count"];
const FINAL_PRODUCT_COUNT_KEYS = [
  "number_of_final_products",
  "final_product_count",
  "final_products_count",
];
const DELIVERY_STATE_KEYS = ["etat_shopper", "delivery_state", "shopper_state"];
const PICKER_STATE_KEYS = ["etat_picker", "picker_state"];

function normalizeKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeRecordKeys(record: LooseRecord): LooseRecord {
  const out: LooseRecord = {};
  for (const [key, value] of Object.entries(record)) {
    out[normalizeKey(key)] = value;
  }
  return out;
}

function pickValue(record: LooseRecord, aliases: string[]): unknown {
  for (const alias of aliases) {
    const val = record[normalizeKey(alias)];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return val;
    }
  }
  return undefined;
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeState(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function toDeliveryType(raw: unknown, storeName: unknown): DeliveryType | null {
  const value = normalizeText(raw);
  const normalizedStoreName = normalizeText(storeName);

  if (value === "express") return "EXPRESS";
  if (value === "rapide xl") return "MARKET";
  if (value === "planned order") return "HYPER";
  if (value === "market") return "MARKET";
  if (value === "hyper") return "HYPER";

  if (normalizedStoreName.startsWith("express ")) return "EXPRESS";
  if (normalizedStoreName.startsWith("market ")) return "MARKET";
  if (normalizedStoreName.startsWith("hyper ")) return "HYPER";

  return null;
}

function isDeliveredLike(value: string | null) {
  return Boolean(
    value &&
      ["delivered", "completed", "done", "fulfilled", "cancelled", "canceled"].includes(value),
  );
}

function toPositiveInt(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

function parseSlashDate(raw: string): Date | null {
  const match = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);

  const parsed = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function toDate(raw: unknown): Date | null {
  if (raw instanceof Date && !Number.isNaN(raw.valueOf())) return raw;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    const millis = raw < 1e12 ? raw * 1000 : raw;
    const d = new Date(millis);
    return Number.isNaN(d.valueOf()) ? null : d;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const slashDate = parseSlashDate(trimmed);
    if (slashDate) {
      return slashDate;
    }

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      const millis = numeric < 1e12 ? numeric * 1000 : numeric;
      const d = new Date(millis);
      return Number.isNaN(d.valueOf()) ? null : d;
    }

    const d = new Date(trimmed);
    return Number.isNaN(d.valueOf()) ? null : d;
  }

  return null;
}

function toDelayMinutes(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

export function extractOrderLifecycleMetadata(record: LooseRecord): OrderLifecycleMetadata {
  const rec = normalizeRecordKeys(record);
  const acceptedAt = toDate(pickValue(rec, ACCEPTED_AT_KEYS));
  const preparationEndedAt = toDate(pickValue(rec, PREPARATION_ENDED_AT_KEYS));
  const productCount = toPositiveInt(pickValue(rec, PRODUCT_COUNT_KEYS));
  const finalProductCount = toPositiveInt(pickValue(rec, FINAL_PRODUCT_COUNT_KEYS));
  const deliveryState = normalizeState(pickValue(rec, DELIVERY_STATE_KEYS));
  const pickerState = normalizeState(pickValue(rec, PICKER_STATE_KEYS));
  const expectedProductCount = productCount ?? finalProductCount;

  return {
    accepted_at: acceptedAt,
    preparation_ended_at: preparationEndedAt,
    product_count: productCount,
    final_product_count: finalProductCount,
    delivery_state: deliveryState,
    picker_state: pickerState,
    delivery_alert_active:
      deliveryState === "alert" || pickerState === "alert",
    expected_preparation_minutes: expectedProductCount
      ? Math.max(1, expectedProductCount) * 2
      : null,
  };
}

function toStatus(raw: unknown, lifecycle: OrderLifecycleMetadata): OrderStatus | null {
  const value = normalizeText(raw);

  if (
    isDeliveredLike(value) ||
    lifecycle.delivery_state === "complete" ||
    lifecycle.delivery_state === "completed" ||
    lifecycle.delivery_state === "canceled" ||
    lifecycle.delivery_state === "cancelled" ||
    lifecycle.picker_state === "complete" ||
    lifecycle.picker_state === "completed" ||
    lifecycle.picker_state === "canceled" ||
    lifecycle.picker_state === "cancelled"
  ) {
    return "delivered";
  }

  if (
    ["prepared", "preparing", "ready"].includes(value) ||
    lifecycle.preparation_ended_at
  ) {
    return "prepared";
  }

  if (
    ["accepted", "confirmed", "assigned"].includes(value) ||
    lifecycle.accepted_at
  ) {
    return "accepted";
  }

  if (
    ["new", "pending", "created", "received"].includes(value) ||
    lifecycle.delivery_state === "received" ||
    lifecycle.picker_state === "received" ||
    value === ""
  ) {
    return "new";
  }

  return null;
}

export interface NormalizationResult {
  normalized: NormalizedOrderRecord[];
  warnings: string[];
}

export function normalizeRedashRecords(input: LooseRecord[]): NormalizationResult {
  const warnings: string[] = [];
  const normalized: NormalizedOrderRecord[] = [];

  input.forEach((record, index) => {
    const rec = normalizeRecordKeys(record);
    const lifecycle = extractOrderLifecycleMetadata(record);

    const orderIdRaw = pickValue(rec, ORDER_ID_KEYS);
    const storeNameRaw = pickValue(rec, STORE_KEYS);
    const deliveryTypeRaw = pickValue(rec, DELIVERY_TYPE_KEYS);
    const statusRaw = pickValue(rec, STATUS_KEYS);
    const createdAtRaw = pickValue(rec, CREATED_AT_KEYS);
    const delayRaw = pickValue(rec, DELAY_KEYS);

    const orderId = orderIdRaw ? String(orderIdRaw).trim() : "";
    const storeName = storeNameRaw ? String(storeNameRaw).trim() : "";
    const deliveryType = toDeliveryType(deliveryTypeRaw, storeNameRaw);
    const status = toStatus(statusRaw, lifecycle);
    const createdAt = toDate(createdAtRaw);
    const delayMinutes = toDelayMinutes(delayRaw);

    if (!orderId) {
      warnings.push(`Skipped row ${index + 1}: missing order_id.`);
      return;
    }
    if (!storeName) {
      warnings.push(`Skipped row ${index + 1}: missing store_name.`);
      return;
    }
    if (!deliveryType) {
      warnings.push(`Skipped row ${index + 1}: unsupported delivery_type for order ${orderId}.`);
      return;
    }
    if (!status) {
      warnings.push(`Skipped row ${index + 1}: unsupported status for order ${orderId}.`);
      return;
    }
    if (!createdAt) {
      warnings.push(`Skipped row ${index + 1}: invalid created_at for order ${orderId}.`);
      return;
    }

    normalized.push({
      order_id: orderId,
      store_name: storeName,
      delivery_type: deliveryType,
      status,
      created_at: createdAt,
      delay_minutes: delayMinutes,
      lifecycle,
      raw: record,
    });
  });

  return { normalized, warnings };
}
