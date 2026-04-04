create table if not exists public.workflow_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  acceptance_grace_minutes integer not null default 3,
  acceptance_reminder_interval_minutes integer not null default 2,
  preparation_minutes_per_product integer not null default 2,
  preparation_reminder_interval_minutes integer not null default 2,
  delivery_alert_reminder_interval_minutes integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflow_settings_company_uniq unique (company_id),
  constraint workflow_settings_acceptance_grace_check
    check (acceptance_grace_minutes between 1 and 180),
  constraint workflow_settings_acceptance_interval_check
    check (acceptance_reminder_interval_minutes between 1 and 180),
  constraint workflow_settings_preparation_minutes_per_product_check
    check (preparation_minutes_per_product between 1 and 60),
  constraint workflow_settings_preparation_interval_check
    check (preparation_reminder_interval_minutes between 1 and 180),
  constraint workflow_settings_delivery_alert_interval_check
    check (delivery_alert_reminder_interval_minutes between 1 and 180)
);

insert into public.workflow_settings (
  company_id,
  acceptance_grace_minutes,
  acceptance_reminder_interval_minutes,
  preparation_minutes_per_product,
  preparation_reminder_interval_minutes,
  delivery_alert_reminder_interval_minutes
)
select
  companies.id,
  3,
  2,
  2,
  2,
  2
from public.companies
where not exists (
  select 1
  from public.workflow_settings
  where workflow_settings.company_id = companies.id
);
