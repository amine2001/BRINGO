# Deployment Guide

## Vercel

- Deploy the Next.js app to Vercel.
- Add all variables from `.env.example` in the Vercel project settings.
- Use the production Supabase database URL and service-role key only on the server.
- Confirm the cron route is deployed at `/api/cron/poll`.

## Supabase

- Create a Supabase project for the SaaS tenant.
- Enable Supabase Auth for login and session handling.
- Create the production tables before enabling the polling job.
- Use Row Level Security where applicable for tenant isolation.

## Telegram

- Create one bot for the platform.
- Add the bot to each store group or admin group.
- Store group chat IDs in the mapping tables, not in code.
- Keep admin delay alerts routed through `TELEGRAM_ADMIN_CHAT_ID`.

## Cron scheduling

Vercel cron does not support 30-second schedules in `vercel.json`.

Recommended production setup:

- Poll every minute with Vercel cron.
- If sub-minute polling is a hard requirement, add an external scheduler that calls the cron endpoint twice per minute.

Why this choice:

- It keeps the deployment simple and Vercel-native.
- It avoids relying on unstable workaround logic.
- It matches the platform limit while documenting the real tradeoff.

## Environment variables

Add these in Vercel and locally:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- `CRON_SECRET`
- `REDASH_API_URL`
- `REDASH_API_KEY`

## Release checklist

- Run database migrations.
- Verify the Redash API URL returns CSV or JSON.
- Confirm Telegram messages reach a test store group.
- Verify the delay alert path sends to the admin chat.
- Confirm cron requests are authenticated.
