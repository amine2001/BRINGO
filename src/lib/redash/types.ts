import type { DeliveryType, OrderStatus } from "@/lib/db";

export type RedashResponseFormat = "auto" | "json" | "csv";

export interface OrderLifecycleMetadata {
  accepted_at: Date | null;
  preparation_ended_at: Date | null;
  product_count: number | null;
  final_product_count: number | null;
  delivery_state: string | null;
  picker_state: string | null;
  delivery_alert_active: boolean;
}

export interface RedashClientConfig {
  apiUrl: string;
  apiKey: string;
  format?: RedashResponseFormat;
  timeoutMs?: number;
}

export interface NormalizedOrderRecord {
  order_id: string;
  store_name: string;
  delivery_type: DeliveryType;
  status: OrderStatus;
  created_at: Date;
  delay_minutes: number | null;
  lifecycle: OrderLifecycleMetadata;
  raw: Record<string, unknown>;
}

export interface RedashFetchResult {
  records: NormalizedOrderRecord[];
  format: Exclude<RedashResponseFormat, "auto">;
  fetchedAt: Date;
  warnings: string[];
}
