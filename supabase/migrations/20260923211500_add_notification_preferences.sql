alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists notification_lead_days integer not null default 1 check (notification_lead_days between 0 and 7),
  add column if not exists notify_due_today boolean not null default true,
  add column if not exists notify_overdue boolean not null default true;