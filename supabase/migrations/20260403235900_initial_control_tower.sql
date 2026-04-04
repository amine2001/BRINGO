create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'delivery_type') then
    create type delivery_type as enum ('EXPRESS', 'MARKET', 'HYPER');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('new', 'accepted', 'prepared', 'delivered');
  end if;

  if not exists (select 1 from pg_type where typname = 'log_level') then
    create type log_level as enum ('info', 'warn', 'error');
  end if;

  if not exists (select 1 from pg_type where typname = 'log_category') then
    create type log_category as enum ('order_processing', 'notification', 'delay_alert', 'redash', 'system');
  end if;

  if not exists (select 1 from pg_type where typname = 'api_response_format') then
    create type api_response_format as enum ('auto', 'json', 'csv');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name varchar(160) not null,
  slug varchar(120) not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  email varchar(320),
  full_name varchar(160),
  role varchar(32) not null default 'operator' check (role in ('admin', 'operator', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name varchar(180) not null,
  code varchar(64),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name),
  unique (company_id, code)
);

create table if not exists public.telegram_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name varchar(180) not null,
  chat_id varchar(64) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, chat_id)
);

create table if not exists public.store_group_mapping (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  telegram_group_id uuid not null references public.telegram_groups(id) on delete cascade,
  delivery_type delivery_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, store_id, delivery_type)
);

create table if not exists public.delivery_type_mapping (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  delivery_type delivery_type not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, store_id, delivery_type)
);

create table if not exists public.orders_cache (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id varchar(120) not null,
  store_name varchar(180) not null,
  store_id uuid references public.stores(id) on delete set null,
  delivery_type delivery_type not null,
  status order_status not null,
  created_at timestamptz not null,
  delay_minutes integer check (delay_minutes is null or delay_minutes >= 0),
  source_payload jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  initial_notification_sent_at timestamptz,
  last_reminder_sent_at timestamptz,
  next_reminder_at timestamptz,
  reminders_sent integer not null default 0 check (reminders_sent >= 0),
  last_notified_status order_status,
  last_notified_at timestamptz,
  notification_count integer not null default 0 check (notification_count >= 0),
  delay_alert_sent_at timestamptz,
  delay_alert_key varchar(255),
  created_ts timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, order_id)
);

create table if not exists public.api_config (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade unique,
  redash_api_url text not null check (redash_api_url ~* '^https?://'),
  redash_api_key text not null,
  redash_query_id varchar(128),
  response_format api_response_format not null default 'auto',
  poll_interval_seconds integer not null default 30 check (poll_interval_seconds between 30 and 300),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  delivery_type delivery_type,
  repeat_count integer not null default 3 check (repeat_count between 0 and 20),
  interval_seconds integer not null default 300 check (interval_seconds between 30 and 86400),
  stop_on_accepted boolean not null default true,
  stop_on_delivered boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, store_id, delivery_type)
);

create table if not exists public.delay_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade unique,
  delay_threshold_minutes integer not null default 15 check (delay_threshold_minutes between 1 and 720),
  telegram_admin_chat_id varchar(64) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.logs (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  level log_level not null default 'info',
  category log_category not null default 'system',
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_company_id on public.users(company_id);
create index if not exists idx_stores_company_id on public.stores(company_id);
create index if not exists idx_telegram_groups_company_id on public.telegram_groups(company_id);
create index if not exists idx_store_group_mapping_company_store on public.store_group_mapping(company_id, store_id);
create index if not exists idx_delivery_type_mapping_company_store on public.delivery_type_mapping(company_id, store_id);
create index if not exists idx_orders_cache_company_status on public.orders_cache(company_id, status);
create index if not exists idx_orders_cache_company_store on public.orders_cache(company_id, store_name);
create index if not exists idx_orders_cache_last_seen on public.orders_cache(company_id, last_seen_at desc);
create index if not exists idx_orders_cache_delay on public.orders_cache(company_id, delay_minutes);
create index if not exists idx_logs_company_created_at on public.logs(company_id, created_at desc);
create index if not exists idx_logs_category_created_at on public.logs(category, created_at desc);

drop trigger if exists trg_companies_set_updated_at on public.companies;
create trigger trg_companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_stores_set_updated_at on public.stores;
create trigger trg_stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

drop trigger if exists trg_telegram_groups_set_updated_at on public.telegram_groups;
create trigger trg_telegram_groups_set_updated_at
before update on public.telegram_groups
for each row execute function public.set_updated_at();

drop trigger if exists trg_store_group_mapping_set_updated_at on public.store_group_mapping;
create trigger trg_store_group_mapping_set_updated_at
before update on public.store_group_mapping
for each row execute function public.set_updated_at();

drop trigger if exists trg_delivery_type_mapping_set_updated_at on public.delivery_type_mapping;
create trigger trg_delivery_type_mapping_set_updated_at
before update on public.delivery_type_mapping
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_cache_set_updated_at on public.orders_cache;
create trigger trg_orders_cache_set_updated_at
before update on public.orders_cache
for each row execute function public.set_updated_at();

drop trigger if exists trg_api_config_set_updated_at on public.api_config;
create trigger trg_api_config_set_updated_at
before update on public.api_config
for each row execute function public.set_updated_at();

drop trigger if exists trg_notification_settings_set_updated_at on public.notification_settings;
create trigger trg_notification_settings_set_updated_at
before update on public.notification_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_delay_settings_set_updated_at on public.delay_settings;
create trigger trg_delay_settings_set_updated_at
before update on public.delay_settings
for each row execute function public.set_updated_at();
