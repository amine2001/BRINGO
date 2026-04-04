import type { DeliveryType, OrderCacheRow, OrderStatus } from "@/lib/db";
import type { NormalizedOrderRecord } from "@/lib/redash";

export interface OrderStatusChange {
  orderId: string;
  storeName: string;
  storeId: string | null;
  deliveryType: DeliveryType;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  createdAt: Date;
  delayMinutes: number | null;
}

export interface NewOrderEvent {
  orderId: string;
  storeName: string;
  storeId: string | null;
  deliveryType: DeliveryType;
  status: OrderStatus;
  createdAt: Date;
  delayMinutes: number | null;
}

export interface OrderProcessingSummary {
  companyId: string;
  receivedCount: number;
  uniqueCount: number;
  insertedCount: number;
  statusChangedCount: number;
  unchangedCount: number;
  processedAt: Date;
}

export interface OrderProcessingResult {
  summary: OrderProcessingSummary;
  newOrders: NewOrderEvent[];
  statusChanges: OrderStatusChange[];
  unchangedOrderIds: string[];
  persistedRows: OrderCacheRow[];
}

export interface OrderProcessorInput {
  companyId: string;
  records: NormalizedOrderRecord[];
}
