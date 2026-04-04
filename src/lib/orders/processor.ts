import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import type { Database, OrderCacheRow } from "@/lib/db";
import { getDb, ordersCache, stores } from "@/lib/db";
import type { NormalizedOrderRecord } from "@/lib/redash";

import type {
  NewOrderEvent,
  OrderProcessingResult,
  OrderProcessorInput,
  OrderStatusChange,
} from "./types";

function dedupeByOrderId(records: NormalizedOrderRecord[]): NormalizedOrderRecord[] {
  const latestByOrder = new Map<string, NormalizedOrderRecord>();

  for (const record of records) {
    const existing = latestByOrder.get(record.order_id);
    if (!existing || record.created_at.valueOf() >= existing.created_at.valueOf()) {
      latestByOrder.set(record.order_id, record);
    }
  }

  return [...latestByOrder.values()];
}

function normalizeStoreName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

async function loadStoreMap(
  db: Database,
  companyId: string,
  records: NormalizedOrderRecord[]
): Promise<Map<string, string>> {
  const storeNames = [...new Set(records.map((record) => normalizeStoreName(record.store_name)))];

  if (!storeNames.length) {
    return new Map();
  }

  const storeRows = await db
    .select({
      id: stores.id,
      name: stores.name,
    })
    .from(stores)
    .where(and(eq(stores.companyId, companyId), eq(stores.isActive, true)));

  return new Map(
    storeRows.map((store) => [normalizeStoreName(store.name), store.id])
  );
}

function toInsertRow(
  companyId: string,
  record: NormalizedOrderRecord,
  storeId: string | null
) {
  return {
    companyId,
    orderId: record.order_id,
    storeName: record.store_name,
    storeId,
    deliveryType: record.delivery_type,
    status: record.status,
    createdAt: record.created_at,
    delayMinutes: record.delay_minutes,
    sourcePayload: record.raw,
    lastSeenAt: new Date(),
    updatedAt: new Date(),
  };
}

async function loadExistingRows(
  db: Database,
  companyId: string,
  orderIds: string[]
): Promise<Map<string, OrderCacheRow>> {
  if (!orderIds.length) return new Map();

  const rows = await db
    .select()
    .from(ordersCache)
    .where(and(eq(ordersCache.companyId, companyId), inArray(ordersCache.orderId, orderIds)));

  return new Map(rows.map((row) => [row.orderId, row]));
}

function classifyChanges(
  existingRows: Map<string, OrderCacheRow>,
  records: NormalizedOrderRecord[],
  storeIdsByName: Map<string, string>
): {
  newOrders: NewOrderEvent[];
  statusChanges: OrderStatusChange[];
  unchangedOrderIds: string[];
} {
  const newOrders: NewOrderEvent[] = [];
  const statusChanges: OrderStatusChange[] = [];
  const unchangedOrderIds: string[] = [];

  for (const record of records) {
    const existing = existingRows.get(record.order_id);
    const storeId = storeIdsByName.get(normalizeStoreName(record.store_name)) ?? null;
    if (!existing) {
      newOrders.push({
        orderId: record.order_id,
        storeName: record.store_name,
        storeId,
        deliveryType: record.delivery_type,
        status: record.status,
        createdAt: record.created_at,
        delayMinutes: record.delay_minutes,
      });
      continue;
    }

    if (existing.status !== record.status) {
      statusChanges.push({
        orderId: record.order_id,
        storeName: record.store_name,
        storeId,
        deliveryType: record.delivery_type,
        previousStatus: existing.status,
        currentStatus: record.status,
        createdAt: record.created_at,
        delayMinutes: record.delay_minutes,
      });
      continue;
    }

    unchangedOrderIds.push(record.order_id);
  }

  return { newOrders, statusChanges, unchangedOrderIds };
}

async function upsertRows(
  db: Database,
  companyId: string,
  records: NormalizedOrderRecord[],
  storeIdsByName: Map<string, string>
): Promise<OrderCacheRow[]> {
  if (!records.length) return [];

  const rows = records.map((record) =>
    toInsertRow(
      companyId,
      record,
      storeIdsByName.get(normalizeStoreName(record.store_name)) ?? null
    )
  );
  const now = new Date();

  return db
    .insert(ordersCache)
    .values(rows)
    .onConflictDoUpdate({
      target: [ordersCache.companyId, ordersCache.orderId],
      set: {
        storeName: sql`excluded.store_name`,
        storeId: sql`excluded.store_id`,
        deliveryType: sql`excluded.delivery_type`,
        status: sql`excluded.status`,
        createdAt: sql`excluded.created_at`,
        delayMinutes: sql`excluded.delay_minutes`,
        sourcePayload: sql`excluded.source_payload`,
        lastSeenAt: now,
        statusChangedAt: sql`case when ${ordersCache.status} <> excluded.status then now() else ${ordersCache.statusChangedAt} end`,
        updatedAt: now,
      },
    })
    .returning();
}

export async function processOrders(
  input: OrderProcessorInput,
  db: Database = getDb()
): Promise<OrderProcessingResult> {
  const processedAt = new Date();
  const dedupedRecords = dedupeByOrderId(input.records);
  const orderIds = dedupedRecords.map((item) => item.order_id);

  const existingRows = await loadExistingRows(db, input.companyId, orderIds);
  const storeIdsByName = await loadStoreMap(db, input.companyId, dedupedRecords);
  const { newOrders, statusChanges, unchangedOrderIds } = classifyChanges(
    existingRows,
    dedupedRecords,
    storeIdsByName
  );
  const persistedRows = await upsertRows(
    db,
    input.companyId,
    dedupedRecords,
    storeIdsByName
  );

  return {
    summary: {
      companyId: input.companyId,
      receivedCount: input.records.length,
      uniqueCount: dedupedRecords.length,
      insertedCount: newOrders.length,
      statusChangedCount: statusChanges.length,
      unchangedCount: unchangedOrderIds.length,
      processedAt,
    },
    newOrders,
    statusChanges,
    unchangedOrderIds,
    persistedRows,
  };
}

export async function getOrderById(
  companyId: string,
  orderId: string,
  db: Database = getDb()
): Promise<OrderCacheRow | null> {
  const row = await db.query.ordersCache.findFirst({
    where: and(eq(ordersCache.companyId, companyId), eq(ordersCache.orderId, orderId)),
  });
  return row ?? null;
}
