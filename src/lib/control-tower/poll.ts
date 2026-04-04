import "server-only";

import {
  and,
  desc,
  eq,
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
  telegramGroups,
  type OrderCacheRow,
} from "@/lib/db";
import {
  buildAdminDelayAlertTelegramPayload,
  evaluateDelayAlert,
} from "@/lib/delay";
import { writeErrorLog, writeInfoLog, writeWarnLog } from "@/lib/logs/service";
import { evaluateOrderNotifications } from "@/lib/notifications";
import { processOrders } from "@/lib/orders";
import { createRedashClient } from "@/lib/redash";
import {
  formatNewOrderMessage,
  formatRepeatedReminderMessage,
  formatStatusChangeMessage,
  sendTelegramText,
  sendTelegramTextToMany,
} from "@/lib/telegram";

type CompanyPollingSummary = {
  companyId: string;
  companyName: string;
  fetchedCount: number;
  insertedCount: number;
  statusChangedCount: number;
  notificationsSent: number;
  delayAlertsSent: number;
  warnings: string[];
};

export type PollingRunSummary = {
  companiesProcessed: number;
  totalFetched: number;
  totalNotificationsSent: number;
  totalDelayAlertsSent: number;
  results: CompanyPollingSummary[];
  runAt: string;
};

type CompanyBundle = {
  companyId: string;
  companyName: string;
  apiConfig: typeof apiConfig.$inferSelect;
  delaySettings: typeof delaySettings.$inferSelect | null;
  deliveryTypeMappings: Array<typeof deliveryTypeMapping.$inferSelect>;
  notificationSettings: Array<typeof notificationSettings.$inferSelect>;
  groupMappings: Array<
    typeof storeGroupMapping.$inferSelect & {
      chatId: string;
      groupName: string;
      groupActive: boolean;
    }
  >;
};

function buildOrderSnapshot(row: OrderCacheRow) {
  return {
    orderId: row.orderId,
    storeName: row.storeName,
    deliveryType: row.deliveryType,
    status: row.status,
    createdAt: row.createdAt,
    delayMinutes: row.delayMinutes,
  };
}

function resolveNotificationPolicy(
  settingsRows: CompanyBundle["notificationSettings"],
  row: OrderCacheRow,
) {
  const matches = settingsRows.filter(
    (settings) =>
      settings.isActive &&
      (settings.storeId === row.storeId || settings.storeId === null) &&
      (settings.deliveryType === row.deliveryType || settings.deliveryType === null),
  );

  matches.sort((left, right) => {
    const leftScore =
      (left.storeId ? 2 : 0) + (left.deliveryType ? 1 : 0);
    const rightScore =
      (right.storeId ? 2 : 0) + (right.deliveryType ? 1 : 0);

    return rightScore - leftScore;
  });

  const selected = matches[0];

  return {
    repeatCount: selected?.repeatCount ?? 3,
    intervalSeconds: selected?.intervalSeconds ?? 300,
    stopWhenAccepted: selected?.stopOnAccepted ?? true,
    stopWhenDelivered: selected?.stopOnDelivered ?? true,
    sendInitialAlert: true,
    sendStatusChangeAlerts: true,
  };
}

function isDeliveryTypeEnabled(
  mappings: CompanyBundle["deliveryTypeMappings"],
  row: OrderCacheRow,
) {
  if (!row.storeId) {
    return false;
  }

  return mappings.some(
    (mapping) =>
      mapping.storeId === row.storeId &&
      mapping.deliveryType === row.deliveryType &&
      mapping.isEnabled,
  );
}

function resolveTelegramChatIds(
  groupMappings: CompanyBundle["groupMappings"],
  row: OrderCacheRow,
) {
  if (!row.storeId) {
    return [];
  }

  return groupMappings
    .filter(
      (mapping) =>
        mapping.storeId === row.storeId &&
        mapping.deliveryType === row.deliveryType &&
        mapping.isActive &&
        mapping.groupActive,
    )
    .map((mapping) => mapping.chatId);
}

async function updateOrderCacheState(
  rowId: string,
  updates: Partial<typeof ordersCache.$inferInsert>,
) {
  const db = getDb();

  await db
    .update(ordersCache)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(ordersCache.id, rowId));
}

async function dispatchOrderNotifications(
  bundle: CompanyBundle,
  row: OrderCacheRow,
  previousStatus: string | null,
): Promise<number> {
  if (!row.storeId) {
    await writeWarnLog(
      bundle.companyId,
      "notification",
      `Skipping notifications for order ${row.orderId} because no store mapping was found.`,
      { orderId: row.orderId, storeName: row.storeName },
    );
    return 0;
  }

  if (!isDeliveryTypeEnabled(bundle.deliveryTypeMappings, row)) {
    return 0;
  }

  const chatIds = resolveTelegramChatIds(bundle.groupMappings, row);
  if (!chatIds.length) {
    await writeWarnLog(
      bundle.companyId,
      "notification",
      `No active Telegram group mapping found for order ${row.orderId}.`,
      {
        orderId: row.orderId,
        storeId: row.storeId,
        deliveryType: row.deliveryType,
      },
    );
    return 0;
  }

  const now = new Date();
  const evaluation = evaluateOrderNotifications(buildOrderSnapshot(row), {
    now,
    previousSnapshot: previousStatus ? { status: previousStatus } : null,
    policy: resolveNotificationPolicy(bundle.notificationSettings, row),
    state: {
      initialSentAt: row.initialNotificationSentAt?.getTime() ?? null,
      lastReminderSentAt: row.lastReminderSentAt?.getTime() ?? null,
      remindersSent: row.remindersSent,
      lastNotifiedStatus: row.lastNotifiedStatus,
    },
  });

  const pendingUpdates: Partial<typeof ordersCache.$inferInsert> = {
    nextReminderAt: evaluation.nextNotificationAt
      ? new Date(evaluation.nextNotificationAt)
      : null,
  };

  let dispatchedMessages = 0;
  let dispatchedNotificationRounds = 0;
  let remindersDispatched = 0;

  for (const draft of evaluation.notificationsToSend) {
    const text =
      draft.kind === "initial"
        ? formatNewOrderMessage({
            storeName: row.storeName,
            deliveryType: row.deliveryType,
            orderId: row.orderId,
            status: row.status,
          })
        : draft.kind === "status-change"
          ? formatStatusChangeMessage({
              storeName: row.storeName,
              deliveryType: row.deliveryType,
              orderId: row.orderId,
              previousStatus: previousStatus ?? row.lastNotifiedStatus ?? row.status,
              nextStatus: row.status,
            })
          : formatRepeatedReminderMessage({
              storeName: row.storeName,
              deliveryType: row.deliveryType,
              orderId: row.orderId,
              status: row.status,
              reminderCount: draft.sequence,
              nextReminderInMinutes: evaluation.nextNotificationAt
                ? Math.max(
                    1,
                    Math.ceil((evaluation.nextNotificationAt - now.getTime()) / 60_000),
                  )
                : undefined,
            });

    const result = await sendTelegramTextToMany({
      chatIds,
      text,
    });

    if (!result.ok) {
      await writeErrorLog(
        bundle.companyId,
        "notification",
        `Telegram dispatch failed for order ${row.orderId}.`,
        {
          orderId: row.orderId,
          draftKind: draft.kind,
          failed: result.failed,
        },
      );
      continue;
    }

    dispatchedMessages += result.sent.length;
    dispatchedNotificationRounds += 1;
    pendingUpdates.lastNotifiedAt = now;
    pendingUpdates.notificationCount =
      row.notificationCount + dispatchedNotificationRounds;
    pendingUpdates.lastNotifiedStatus = row.status;

    if (draft.kind === "initial" && !row.initialNotificationSentAt) {
      pendingUpdates.initialNotificationSentAt = now;
    }

    if (draft.kind === "reminder") {
      remindersDispatched += 1;
      pendingUpdates.lastReminderSentAt = now;
      pendingUpdates.remindersSent = row.remindersSent + remindersDispatched;
    }
  }

  if (evaluation.stopReason) {
    pendingUpdates.nextReminderAt = null;
  }

  await updateOrderCacheState(row.id, pendingUpdates);

  return dispatchedMessages;
}

async function dispatchDelayAlert(
  bundle: CompanyBundle,
  row: OrderCacheRow,
): Promise<number> {
  if (!bundle.delaySettings || !bundle.delaySettings.isActive) {
    return 0;
  }

  const decision = await evaluateDelayAlert(
    {
      companyId: bundle.companyId,
      orderId: row.orderId,
      storeId: row.storeId ?? row.orderId,
      storeName: row.storeName,
      deliveryType: row.deliveryType,
      status: row.status,
      delayMinutes: row.delayMinutes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    {
      enabled: bundle.delaySettings.isActive,
      delayThresholdMinutes: bundle.delaySettings.delayThresholdMinutes,
      telegramAdminChatId: bundle.delaySettings.telegramAdminChatId,
    },
    {
      get: (key) =>
        row.delayAlertKey === key && row.delayAlertSentAt
          ? {
              key,
              emittedAt: row.delayAlertSentAt.toISOString(),
              delayMinutes: row.delayMinutes ?? 0,
              thresholdMinutes: bundle.delaySettings?.delayThresholdMinutes ?? 0,
            }
          : null,
      set: () => undefined,
      delete: () => undefined,
    },
    { now: new Date() },
  );

  if (decision.reason === "terminal-status") {
    await updateOrderCacheState(row.id, {
      delayAlertKey: null,
      delayAlertSentAt: null,
    });
    return 0;
  }

  if (!decision.shouldSend) {
    return 0;
  }

  const payload = buildAdminDelayAlertTelegramPayload(
    decision,
    bundle.delaySettings.telegramAdminChatId,
  );

  const result = await sendTelegramText({
    chatId: payload.chat_id,
    text: payload.text,
    parseMode: "HTML",
  });

  if (!result.ok) {
    await writeErrorLog(
      bundle.companyId,
      "delay_alert",
      `Admin delay alert failed for order ${row.orderId}.`,
      {
        orderId: row.orderId,
        error: result.error,
      },
    );
    return 0;
  }

  await updateOrderCacheState(row.id, {
    delayAlertKey: decision.alertKey,
    delayAlertSentAt: new Date(),
  });

  return 1;
}

async function loadCompanyBundle(
  companyId: string,
): Promise<CompanyBundle | null> {
  const db = getDb();

  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.isActive, true)))
    .limit(1);

  if (!company) {
    return null;
  }

  const [apiConfigRow] = await db
    .select()
    .from(apiConfig)
    .where(and(eq(apiConfig.companyId, companyId), eq(apiConfig.isActive, true)))
    .limit(1);

  if (!apiConfigRow) {
    return null;
  }

  const [delaySettingsRow] = await db
    .select()
    .from(delaySettings)
    .where(and(eq(delaySettings.companyId, companyId), eq(delaySettings.isActive, true)))
    .limit(1);

  const [deliveryTypeRows, notificationSettingRows, mappingRows] = await Promise.all([
    db
      .select()
      .from(deliveryTypeMapping)
      .where(eq(deliveryTypeMapping.companyId, companyId)),
    db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.companyId, companyId)),
    db
      .select({
        id: storeGroupMapping.id,
        companyId: storeGroupMapping.companyId,
        storeId: storeGroupMapping.storeId,
        telegramGroupId: storeGroupMapping.telegramGroupId,
        deliveryType: storeGroupMapping.deliveryType,
        isActive: storeGroupMapping.isActive,
        createdAt: storeGroupMapping.createdAt,
        updatedAt: storeGroupMapping.updatedAt,
        chatId: telegramGroups.chatId,
        groupName: telegramGroups.name,
        groupActive: telegramGroups.isActive,
      })
      .from(storeGroupMapping)
      .innerJoin(
        telegramGroups,
        eq(storeGroupMapping.telegramGroupId, telegramGroups.id),
      )
      .where(eq(storeGroupMapping.companyId, companyId)),
  ]);

  return {
    companyId,
    companyName: company.name,
    apiConfig: apiConfigRow,
    delaySettings: delaySettingsRow ?? null,
    deliveryTypeMappings: deliveryTypeRows,
    notificationSettings: notificationSettingRows,
    groupMappings: mappingRows,
  };
}

export async function runCompanyPollingCycle(
  companyId: string,
): Promise<CompanyPollingSummary> {
  const bundle = await loadCompanyBundle(companyId);

  if (!bundle) {
    throw new Error(`No active API config found for company ${companyId}.`);
  }

  const redashClient = createRedashClient({
    apiUrl: bundle.apiConfig.redashApiUrl,
    apiKey: bundle.apiConfig.redashApiKey,
    format: bundle.apiConfig.responseFormat,
  });

  const fetchResult = await redashClient.fetchOrders();
  const processing = await processOrders({
    companyId,
    records: fetchResult.records,
  });

  if (fetchResult.warnings.length) {
    await writeWarnLog(
      companyId,
      "redash",
      `Redash fetch completed with ${fetchResult.warnings.length} warnings.`,
      { warnings: fetchResult.warnings },
    );
  } else {
    await writeInfoLog(companyId, "redash", "Redash fetch completed successfully.", {
      format: fetchResult.format,
      fetchedCount: fetchResult.records.length,
    });
  }

  const statusChangeMap = new Map(
    processing.statusChanges.map((statusChange) => [
      statusChange.orderId,
      statusChange.previousStatus,
    ]),
  );

  let notificationsSent = 0;
  let delayAlertsSent = 0;

  for (const row of processing.persistedRows) {
    notificationsSent += await dispatchOrderNotifications(
      bundle,
      row,
      statusChangeMap.get(row.orderId) ?? null,
    );
    delayAlertsSent += await dispatchDelayAlert(bundle, row);
  }

  await writeInfoLog(
    companyId,
    "order_processing",
    `Processed ${processing.summary.uniqueCount} unique orders.`,
    {
      insertedCount: processing.summary.insertedCount,
      statusChangedCount: processing.summary.statusChangedCount,
      unchangedCount: processing.summary.unchangedCount,
      notificationsSent,
      delayAlertsSent,
    },
  );

  return {
    companyId,
    companyName: bundle.companyName,
    fetchedCount: fetchResult.records.length,
    insertedCount: processing.summary.insertedCount,
    statusChangedCount: processing.summary.statusChangedCount,
    notificationsSent,
    delayAlertsSent,
    warnings: fetchResult.warnings,
  };
}

export async function runPollingCycleForAllCompanies(): Promise<PollingRunSummary> {
  const db = getDb();
  const activeCompanies = await db
    .select({
      id: companies.id,
    })
    .from(companies)
    .where(eq(companies.isActive, true))
    .orderBy(desc(companies.createdAt));

  const results: CompanyPollingSummary[] = [];

  for (const company of activeCompanies) {
    try {
      results.push(await runCompanyPollingCycle(company.id));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown polling error.";
      await writeErrorLog(
        company.id,
        "system",
        `Polling cycle failed for company ${company.id}.`,
        { error: message },
      );
      results.push({
        companyId: company.id,
        companyName: company.id,
        fetchedCount: 0,
        insertedCount: 0,
        statusChangedCount: 0,
        notificationsSent: 0,
        delayAlertsSent: 0,
        warnings: [message],
      });
    }
  }

  return {
    companiesProcessed: results.length,
    totalFetched: results.reduce((sum, result) => sum + result.fetchedCount, 0),
    totalNotificationsSent: results.reduce(
      (sum, result) => sum + result.notificationsSent,
      0,
    ),
    totalDelayAlertsSent: results.reduce(
      (sum, result) => sum + result.delayAlertsSent,
      0,
    ),
    results,
    runAt: new Date().toISOString(),
  };
}
