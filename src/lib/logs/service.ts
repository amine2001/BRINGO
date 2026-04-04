import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb, logs, type LogCategory, type LogLevel, type NewLogEntry } from "@/lib/db";

type LogInput = Omit<NewLogEntry, "id" | "createdAt">;

export async function writeLog(input: LogInput) {
  const db = getDb();

  await db.insert(logs).values(input);
}

export async function writeInfoLog(
  companyId: string,
  category: LogCategory,
  message: string,
  context: Record<string, unknown> = {},
) {
  await writeLog({
    companyId,
    category,
    level: "info",
    message,
    context,
  });
}

export async function writeWarnLog(
  companyId: string,
  category: LogCategory,
  message: string,
  context: Record<string, unknown> = {},
) {
  await writeLog({
    companyId,
    category,
    level: "warn",
    message,
    context,
  });
}

export async function writeErrorLog(
  companyId: string,
  category: LogCategory,
  message: string,
  context: Record<string, unknown> = {},
) {
  await writeLog({
    companyId,
    category,
    level: "error",
    message,
    context,
  });
}

export async function listRecentLogs(companyId: string, limit = 25) {
  const db = getDb();

  return db
    .select()
    .from(logs)
    .where(eq(logs.companyId, companyId))
    .orderBy(desc(logs.createdAt))
    .limit(limit);
}

export function toLogBadgeTone(level: LogLevel) {
  switch (level) {
    case "error":
      return "warn";
    case "warn":
      return "neutral";
    default:
      return "good";
  }
}
