import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __lmctSql?: Sql;
  __lmctDb?: Database;
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

export function getSqlClient(): Sql {
  if (!globalForDb.__lmctSql) {
    globalForDb.__lmctSql = postgres(getDatabaseUrl(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    });
  }

  return globalForDb.__lmctSql;
}

export function getDb(): Database {
  if (!globalForDb.__lmctDb) {
    globalForDb.__lmctDb = drizzle(getSqlClient(), { schema });
  }

  return globalForDb.__lmctDb;
}

export async function closeDb(): Promise<void> {
  if (globalForDb.__lmctSql) {
    await globalForDb.__lmctSql.end({ timeout: 5 });
    globalForDb.__lmctSql = undefined;
    globalForDb.__lmctDb = undefined;
  }
}

export type { Database };
