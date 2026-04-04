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
  ordersCache,
  storeGroupMapping,
  telegramGroups,
  workflowSettings,
  type OrderCacheRow,
} from "@/lib/db";
import {
  buildAdminDelayAlertTelegramPayload,
  evaluateDelayAlert,
} from "@/lib/delay";
import { resolveChatIdForStatus } from "@/lib/delay/chat-routing";
import { writeErrorLog, writeInfoLog, writeWarnLog } from "@/lib/logs/service";
import {
  evaluateNotificationWorkflow,
  resolveNotificationWorkflowConfig,
} from "@/lib/notifications";
import { processOrders } from "@/lib/orders";
import { createRedashClient, extractOrderLifecycleMetadata } from "@/lib/redash";
import {
  formatNewOrderMessage,
  formatWorkflowReminderMessage,
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
  workflowSettings: typeof workflowSettings.$inferSelect | null;
  deliveryTypeMappings: Array<typeof deliveryTypeMapping.$inferSelect>;
  groupMappings: Array<
    typeof storeGroupMapping.$inferSelect & {
      chatId: string;
      groupName: string;
      groupActive: boolean;
    }
  >;
};

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
  const lifecycle = extractOrderLifecycleMetadata(
    row.sourcePayload && typeof row.sourcePayload === "object"
      ? (row.sourcePayload as Record<string, unknown>)
      : {},
  );
  const workflow = evaluateNotificationWorkflow(lifecycle, {
    createdAt: row.createdAt,
    status: row.status,
    now,
    initialSentAt: row.initialNotificationSentAt?.getTime() ?? null,
    lastReminderSentAt: row.lastReminderSentAt?.getTime() ?? null,
    remindersSent: row.remindersSent,
    previousStatus,
  }, resolveNotificationWorkflowConfig(bundle.workflowSettings));

  const pendingUpdates: Partial<typeof ordersCache.$inferInsert> = {
    nextReminderAt: workflow.nextReminderAt
      ? new Date(workflow.nextReminderAt)
      : null,
  };

  let dispatchedMessages = 0;
  let dispatchedNotificationRounds = 0;

  if (workflow.resetReminderState) {
    pendingUpdates.lastReminderSentAt = null;
    pendingUpdates.remindersSent = 0;
  }

  if (workflow.shouldSendInitial) {
    const result = await sendTelegramTextToMany({
      chatIds,
      text: formatNewOrderMessage({
        storeName: row.storeName,
        deliveryType: row.deliveryType,
        orderId: row.orderId,
        status: row.status,
      }),
    });

    if (!result.ok) {
      await writeErrorLog(
        bundle.companyId,
        "notification",
        `Telegram dispatch failed for order ${row.orderId}.`,
        {
          orderId: row.orderId,
          notificationType: "initial",
          failed: result.failed,
        },
      );
    } else {
      dispatchedMessages += result.sent.length;
      dispatchedNotificationRounds += 1;
      pendingUpdates.initialNotificationSentAt = now;
      pendingUpdates.lastNotifiedAt = now;
      pendingUpdates.lastNotifiedStatus = row.status;
      pendingUpdates.notificationCount = row.notificationCount + dispatchedNotificationRounds;
    }
  }

  if (workflow.shouldSendReminder && workflow.stage) {
    const result = await sendTelegramTextToMany({
      chatIds,
      text: formatWorkflowReminderMessage({
        storeName: row.storeName,
        deliveryType: row.deliveryType,
        orderId: row.orderId,
        stage: workflow.stage,
        reminderCount: workflow.reminderCount,
        overdueMinutes: workflow.overdueMinutes,
        productCount: workflow.productCount,
        expectedPreparationMinutes: workflow.expectedPreparationMinutes,
      }),
    });

    if (!result.ok) {
      await writeErrorLog(
        bundle.companyId,
        "notification",
        `Telegram dispatch failed for order ${row.orderId}.`,
        {
          orderId: row.orderId,
          notificationType: workflow.stage,
          failed: result.failed,
        },
      );
    } else {
      dispatchedMessages += result.sent.length;
      dispatchedNotificationRounds += 1;
      pendingUpdates.lastReminderSentAt = now;
      pendingUpdates.remindersSent = workflow.reminderCount;
      pendingUpdates.lastNotifiedAt = now;
      pendingUpdates.lastNotifiedStatus = row.status;
      pendingUpdates.notificationCount = row.notificationCount + dispatchedNotificationRounds;
    }
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
    resolveChatIdForStatus(bundle.delaySettings.telegramAdminChatId, row.status),
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

  const [workflowSettingsRow] = await db
    .select()
    .from(workflowSettings)
    .where(eq(workflowSettings.companyId, companyId))
    .limit(1);

  const [deliveryTypeRows, mappingRows] = await Promise.all([
    db
      .select()
      .from(deliveryTypeMapping)
      .where(eq(deliveryTypeMapping.companyId, companyId)),
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
    workflowSettings: workflowSettingsRow ?? null,
    deliveryTypeMappings: deliveryTypeRows,
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
