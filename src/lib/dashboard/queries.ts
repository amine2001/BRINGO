import "server-only";

import { startOfDay } from "date-fns";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ne,
} from "drizzle-orm";

import {
  apiConfig,
  companies,
  delaySettings,
  deliveryTypeMapping,
  getDb,
  notificationSettings,
  ordersCache,
  storeGroupMapping,
  stores,
  telegramGroups,
  users,
} from "@/lib/db";
import { listRecentLogs } from "@/lib/logs/service";

function labelStatus(status: string) {
  return status.replace(/_/g, " ");
}

export async function getDashboardOverviewData(companyId: string) {
  const db = getDb();
  const startToday = startOfDay(new Date());

  const [
    [{ ordersInMotion }],
    [{ pendingNotifications }],
    [{ delayAlertsToday }],
    recentOrders,
    recentLogs,
  ] = await Promise.all([
    db
      .select({ ordersInMotion: count() })
      .from(ordersCache)
      .where(and(eq(ordersCache.companyId, companyId), ne(ordersCache.status, "delivered"))),
    db
      .select({ pendingNotifications: count() })
      .from(ordersCache)
      .where(
        and(
          eq(ordersCache.companyId, companyId),
          gte(ordersCache.nextReminderAt, new Date()),
        ),
      ),
    db
      .select({ delayAlertsToday: count() })
      .from(ordersCache)
      .where(
        and(
          eq(ordersCache.companyId, companyId),
          gte(ordersCache.delayAlertSentAt, startToday),
        ),
      ),
    db
      .select()
      .from(ordersCache)
      .where(eq(ordersCache.companyId, companyId))
      .orderBy(desc(ordersCache.lastSeenAt))
      .limit(6),
    listRecentLogs(companyId, 6),
  ]);

  return {
    metrics: {
      ordersInMotion,
      pendingNotifications,
      delayAlertsToday,
      telegramDeliverySuccess:
        recentLogs.length > 0
          ? `${Math.max(
              0,
              100 -
                Math.round(
                  (recentLogs.filter((entry) => entry.level === "error").length /
                    recentLogs.length) *
                    100,
                ),
            )}%`
          : "100%",
    },
    recentOrders,
    recentLogs,
  };
}

export async function getStoresPageData(companyId: string) {
  const db = getDb();

  const [storeRows, typeRows, mappingRows] = await Promise.all([
    db
      .select()
      .from(stores)
      .where(eq(stores.companyId, companyId))
      .orderBy(asc(stores.name)),
    db
      .select()
      .from(deliveryTypeMapping)
      .where(eq(deliveryTypeMapping.companyId, companyId)),
    db
      .select({
        storeId: storeGroupMapping.storeId,
        deliveryType: storeGroupMapping.deliveryType,
        chatId: telegramGroups.chatId,
        groupName: telegramGroups.name,
      })
      .from(storeGroupMapping)
      .innerJoin(telegramGroups, eq(storeGroupMapping.telegramGroupId, telegramGroups.id))
      .where(eq(storeGroupMapping.companyId, companyId)),
  ]);

  return {
    stores: storeRows.map((store) => {
      const enabledTypes = typeRows
        .filter((row) => row.storeId === store.id && row.isEnabled)
        .map((row) => row.deliveryType);
      const routes = mappingRows.filter((row) => row.storeId === store.id);

      return {
        ...store,
        enabledTypes,
        routes,
      };
    }),
  };
}

export async function getTelegramGroupsPageData(companyId: string) {
  const db = getDb();

  const [groupRows, mappingRows, storeRows] = await Promise.all([
    db
      .select()
      .from(telegramGroups)
      .where(eq(telegramGroups.companyId, companyId))
      .orderBy(asc(telegramGroups.name)),
    db
      .select()
      .from(storeGroupMapping)
      .where(eq(storeGroupMapping.companyId, companyId)),
    db
      .select()
      .from(stores)
      .where(eq(stores.companyId, companyId)),
  ]);

  return {
    groups: groupRows.map((group) => {
      const mappings = mappingRows.filter((mapping) => mapping.telegramGroupId === group.id);
      return {
        ...group,
        mappings: mappings.map((mapping) => ({
          ...mapping,
          storeName:
            storeRows.find((store) => store.id === mapping.storeId)?.name ?? "Unknown store",
        })),
      };
    }),
    stores: storeRows,
  };
}

export async function getNotificationSettingsPageData(companyId: string) {
  const db = getDb();

  const [settingsRows, storeRows] = await Promise.all([
    db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.companyId, companyId))
      .orderBy(desc(notificationSettings.updatedAt)),
    db
      .select()
      .from(stores)
      .where(eq(stores.companyId, companyId))
      .orderBy(asc(stores.name)),
  ]);

  return {
    settings: settingsRows.map((settings) => ({
      ...settings,
      storeName:
        storeRows.find((store) => store.id === settings.storeId)?.name ??
        "Global default",
    })),
    stores: storeRows,
  };
}

export async function getDelaySettingsPageData(companyId: string) {
  const db = getDb();

  const [settingsRow] = await db
    .select()
    .from(delaySettings)
    .where(eq(delaySettings.companyId, companyId))
    .limit(1);

  return {
    settings: settingsRow ?? null,
  };
}

export async function getApiConfigPageData(companyId: string) {
  const db = getDb();

  const [configRow, latestOrder] = await Promise.all([
    db
      .select()
      .from(apiConfig)
      .where(eq(apiConfig.companyId, companyId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select()
      .from(ordersCache)
      .where(eq(ordersCache.companyId, companyId))
      .orderBy(desc(ordersCache.lastSeenAt))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  return {
    config: configRow,
    lastSyncedAt: latestOrder?.lastSeenAt ?? null,
  };
}

export async function getUsersPageData(companyId: string) {
  const db = getDb();

  const [userRows, companyRows] = await Promise.all([
    db
      .select()
      .from(users)
      .where(eq(users.companyId, companyId))
      .orderBy(asc(users.fullName), asc(users.email)),
    db.select().from(companies).orderBy(asc(companies.name)),
  ]);

  return {
    users: userRows,
    companies: companyRows,
  };
}

export async function getLogsPageData(companyId: string) {
  const recentLogs = await listRecentLogs(companyId, 100);

  return {
    logs: recentLogs.map((entry) => ({
      ...entry,
      categoryLabel: labelStatus(entry.category),
    })),
  };
}
