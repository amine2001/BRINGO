# Last Mile Control Tower

API-driven order control tower for Redash-backed operations with Supabase Auth, PostgreSQL, and Telegram notifications.

## What this replaces

- Scraping-based polling
- Slot / `time-slot` logic
- Hardcoded Telegram routing

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Telegram Bot API
- Vercel cron jobs

## Local setup

1. Install dependencies.

```bash
npm install
```

2. Create your local env file from the example.

```bash
copy .env.example .env.local
```

3. Fill in all required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- `CRON_SECRET`
- `REDASH_API_URL`
- `REDASH_API_KEY`

4. Run the app.

```bash
npm run dev
```

## Database and migration notes

Use Supabase as the source of truth for authentication and data. The production schema should include the tables described in the product spec:

- `users`
- `stores`
- `telegram_groups`
- `store_group_mapping`
- `delivery_type_mapping`
- `orders_cache`
- `api_config`
- `notification_settings`
- `delay_settings`
- `logs`

Migration guidance:

- Create the schema in Supabase first.
- Apply migrations before enabling cron jobs.
- Keep secrets out of git and use `.env.local` for local development.
- Store notification and Redash settings per tenant/company if multi-tenant mode is enabled.

## Vercel deployment

1. Import the repository into Vercel.
2. Add all environment variables from `.env.example` in the Vercel dashboard.
3. Link the project to the correct Supabase database.
4. Deploy on the default Node runtime.
5. Confirm the cron route is reachable and protected by `CRON_SECRET`.

### Cron tradeoff

Vercel cron schedules are minute-level, so true 30-second polling is not available through `vercel.json`.

Current config:

- `vercel.json` schedules `/api/cron/poll` every minute.

If you must run every 30 seconds:

- Use an external scheduler that can hit the cron endpoint twice per minute.
- Or move polling into a dedicated worker outside Vercel cron.

The minute schedule is the closest practical Vercel-native option and is the safer default for production.

## Telegram setup

- Create a Telegram bot and save the token in `TELEGRAM_BOT_TOKEN`.
- Add the bot to the target groups.
- Use the group `chat_id` values in your mapping tables.
- Reserve `TELEGRAM_ADMIN_CHAT_ID` for delay alerts and operational warnings.

## Redash integration

The runtime should fetch data from Redash using the configured API URL and API key, normalize order fields, and write deduplicated results into `orders_cache`.

Expected normalized fields:

- `order_id`
- `store_name`
- `delivery_type`
- `status`
- `created_at`
- `delay_minutes`

## Security checklist

- Protect cron endpoints with `CRON_SECRET`.
- Validate all inbound payloads.
- Use service-role credentials only on the server.
- Never expose Telegram or Redash secrets in the client bundle.

## Docs

- [Deployment guide](docs/deployment.md)
- [Local setup guide](docs/local-setup.md)
