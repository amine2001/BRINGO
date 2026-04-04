import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  apiConfig,
  companies,
  delaySettings,
  deliveryTypeMapping,
  logs,
  notificationSettings,
  ordersCache,
  storeGroupMapping,
  stores,
  telegramGroups,
  users,
} from "./schema";

export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Store = InferSelectModel<typeof stores>;
export type NewStore = InferInsertModel<typeof stores>;

export type TelegramGroup = InferSelectModel<typeof telegramGroups>;
export type NewTelegramGroup = InferInsertModel<typeof telegramGroups>;

export type StoreGroupMapping = InferSelectModel<typeof storeGroupMapping>;
export type NewStoreGroupMapping = InferInsertModel<typeof storeGroupMapping>;

export type DeliveryTypeMapping = InferSelectModel<typeof deliveryTypeMapping>;
export type NewDeliveryTypeMapping = InferInsertModel<typeof deliveryTypeMapping>;

export type OrderCacheRow = InferSelectModel<typeof ordersCache>;
export type NewOrderCacheRow = InferInsertModel<typeof ordersCache>;

export type ApiConfig = InferSelectModel<typeof apiConfig>;
export type NewApiConfig = InferInsertModel<typeof apiConfig>;

export type NotificationSettings = InferSelectModel<typeof notificationSettings>;
export type NewNotificationSettings = InferInsertModel<typeof notificationSettings>;

export type DelaySettings = InferSelectModel<typeof delaySettings>;
export type NewDelaySettings = InferInsertModel<typeof delaySettings>;

export type LogEntry = InferSelectModel<typeof logs>;
export type NewLogEntry = InferInsertModel<typeof logs>;

export type DeliveryType = "EXPRESS" | "MARKET" | "HYPER";
export type OrderStatus = "new" | "accepted" | "prepared" | "delivered";
export type LogLevel = "info" | "warn" | "error";
export type LogCategory =
  | "order_processing"
  | "notification"
  | "delay_alert"
  | "redash"
  | "system";
