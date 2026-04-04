# Local Setup

## Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- A Redash API endpoint and API key
- A Telegram bot token

## Steps

1. Install dependencies.

```bash
npm install
```

2. Copy the example environment file.

```bash
copy .env.example .env.local
```

3. Populate the required values.

4. Start the development server.

```bash
npm run dev
```

## Required environment values

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- `CRON_SECRET`
- `REDASH_API_URL`
- `REDASH_API_KEY`

## Migration notes

- Remove any scraping-based polling from the previous system.
- Replace any hardcoded Telegram chat IDs with database-driven mappings.
- Keep delivery-type routing configurable per store.
- Do not introduce slot or créneau logic.

## Smoke test checklist

- App loads locally.
- Supabase auth variables are present.
- Database connection string is valid.
- Redash endpoint can be fetched from the server.
- Telegram bot can send a test message.
