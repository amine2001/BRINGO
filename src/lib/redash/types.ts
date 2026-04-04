import type { DeliveryType, OrderStatus } from "@/lib/db";

export type RedashResponseFormat = "auto" | "json" | "csv";

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
  raw: Record<string, unknown>;
}

export interface RedashFetchResult {
  records: NormalizedOrderRecord[];
  format: Exclude<RedashResponseFormat, "auto">;
  fetchedAt: Date;
  warnings: string[];
}
