import {
  bigint,
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const deliveryTypeEnum = pgEnum("delivery_type", [
  "EXPRESS",
  "MARKET",
  "HYPER",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "accepted",
  "prepared",
  "delivered",
]);

export const logLevelEnum = pgEnum("log_level", ["info", "warn", "error"]);
export const logCategoryEnum = pgEnum("log_category", [
  "order_processing",
  "notification",
  "delay_alert",
  "redash",
  "system",
]);

export const apiResponseFormatEnum = pgEnum("api_response_format", [
  "auto",
  "json",
  "csv",
]);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("companies_slug_uidx").on(table.slug)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }),
    fullName: varchar("full_name", { length: 160 }),
    role: varchar("role", { length: 32 }).notNull().default("operator"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("users_company_email_uniq").on(table.companyId, table.email),
    check(
      "users_role_check",
      sql`${table.role} in ('admin', 'operator', 'viewer')`
    ),
  ]
);

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    code: varchar("code", { length: 64 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("stores_company_name_uniq").on(table.companyId, table.name),
    unique("stores_company_code_uniq").on(table.companyId, table.code),
  ]
);

export const telegramGroups = pgTable(
  "telegram_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    chatId: varchar("chat_id", { length: 64 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("telegram_groups_company_chat_uniq").on(table.companyId, table.chatId)]
);

export const storeGroupMapping = pgTable(
  "store_group_mapping",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    telegramGroupId: uuid("telegram_group_id")
      .notNull()
      .references(() => telegramGroups.id, { onDelete: "cascade" }),
    deliveryType: deliveryTypeEnum("delivery_type").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("store_group_mapping_company_store_type_uniq").on(
      table.companyId,
      table.storeId,
      table.deliveryType
    ),
  ]
);

export const deliveryTypeMapping = pgTable(
  "delivery_type_mapping",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    deliveryType: deliveryTypeEnum("delivery_type").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("delivery_type_mapping_company_store_type_uniq").on(
      table.companyId,
      table.storeId,
      table.deliveryType
    ),
  ]
);

export const ordersCache = pgTable(
  "orders_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    orderId: varchar("order_id", { length: 120 }).notNull(),
    storeName: varchar("store_name", { length: 180 }).notNull(),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
    deliveryType: deliveryTypeEnum("delivery_type").notNull(),
    status: orderStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    delayMinutes: integer("delay_minutes"),
    sourcePayload: jsonb("source_payload").notNull().default(sql`'{}'::jsonb`),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    initialNotificationSentAt: timestamp("initial_notification_sent_at", {
      withTimezone: true,
    }),
    lastReminderSentAt: timestamp("last_reminder_sent_at", {
      withTimezone: true,
    }),
    nextReminderAt: timestamp("next_reminder_at", { withTimezone: true }),
    remindersSent: integer("reminders_sent").notNull().default(0),
    lastNotifiedStatus: orderStatusEnum("last_notified_status"),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    notificationCount: integer("notification_count").notNull().default(0),
    delayAlertSentAt: timestamp("delay_alert_sent_at", { withTimezone: true }),
    delayAlertKey: varchar("delay_alert_key", { length: 255 }),
    createdTs: timestamp("created_ts", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("orders_cache_company_order_uniq").on(table.companyId, table.orderId),
    check("orders_cache_delay_minutes_check", sql`${table.delayMinutes} is null or ${table.delayMinutes} >= 0`),
    check("orders_cache_notification_count_check", sql`${table.notificationCount} >= 0`),
    check("orders_cache_reminders_sent_check", sql`${table.remindersSent} >= 0`),
  ]
);

export const apiConfig = pgTable(
  "api_config",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    redashApiUrl: text("redash_api_url").notNull(),
    redashApiKey: text("redash_api_key").notNull(),
    redashQueryId: varchar("redash_query_id", { length: 128 }),
    responseFormat: apiResponseFormatEnum("response_format")
      .notNull()
      .default("auto"),
    pollIntervalSeconds: integer("poll_interval_seconds").notNull().default(30),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("api_config_company_uniq").on(table.companyId),
    check("api_config_poll_interval_check", sql`${table.pollIntervalSeconds} between 30 and 300`),
  ]
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    deliveryType: deliveryTypeEnum("delivery_type"),
    repeatCount: integer("repeat_count").notNull().default(3),
    intervalSeconds: integer("interval_seconds").notNull().default(300),
    stopOnAccepted: boolean("stop_on_accepted").notNull().default(true),
    stopOnDelivered: boolean("stop_on_delivered").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("notification_settings_company_store_type_uniq").on(
      table.companyId,
      table.storeId,
      table.deliveryType
    ),
    check("notification_settings_repeat_count_check", sql`${table.repeatCount} between 0 and 20`),
    check("notification_settings_interval_seconds_check", sql`${table.intervalSeconds} between 30 and 86400`),
  ]
);

export const delaySettings = pgTable(
  "delay_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    delayThresholdMinutes: integer("delay_threshold_minutes").notNull().default(15),
    telegramAdminChatId: varchar("telegram_admin_chat_id", { length: 64 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("delay_settings_company_uniq").on(table.companyId),
    check("delay_settings_threshold_check", sql`${table.delayThresholdMinutes} between 1 and 720`),
  ]
);

export const logs = pgTable(
  "logs",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    level: logLevelEnum("level").notNull().default("info"),
    category: logCategoryEnum("category").notNull().default("system"),
    message: text("message").notNull(),
    context: jsonb("context").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  () => []
);
