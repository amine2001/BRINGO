import { z } from "zod";

const urlSchema = z.url();

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: urlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const supabaseAdminEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

const telegramEnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_ADMIN_CHAT_ID: z.string().min(1).optional(),
  TELEGRAM_API_BASE_URL: urlSchema.optional(),
  TELEGRAM_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  TELEGRAM_RETRY_ATTEMPTS: z.coerce.number().int().min(0).optional(),
  TELEGRAM_RETRY_DELAY_MS: z.coerce.number().int().min(0).optional(),
});

const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(1),
});

const redashEnvSchema = z.object({
  REDASH_API_URL: urlSchema,
  REDASH_API_KEY: z.string().min(1),
  REDASH_POLL_INTERVAL_SECONDS: z.coerce.number().int().positive().optional(),
});

const appEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: urlSchema.optional(),
});

export function getSupabaseEnv() {
  return supabaseEnvSchema.parse(process.env);
}

export function getDatabaseEnv() {
  return databaseEnvSchema.parse(process.env);
}

export function getSupabaseAdminEnv() {
  return supabaseAdminEnvSchema.parse(process.env);
}

export function getTelegramEnv() {
  return telegramEnvSchema.parse(process.env);
}

export function getCronEnv() {
  return cronEnvSchema.parse(process.env);
}

export function getRedashEnv() {
  return redashEnvSchema.parse(process.env);
}

export function getAppEnv() {
  return appEnvSchema.parse(process.env);
}
