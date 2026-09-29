create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  email text not null check (char_length(email) between 5 and 320),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id),
  constraint signup_requests_processed_fields_check check (
    (status = 'pending' and processed_at is null and processed_by is null)
    or
    (status in ('approved', 'rejected') and processed_at is not null and processed_by is not null)
  )
);

create unique index if not exists signup_requests_active_email_idx
  on public.signup_requests (lower(email))
  where status in ('pending', 'approved');

create index if not exists signup_requests_pending_created_idx
  on public.signup_requests (created_at desc)
  where status = 'pending';

alter table public.signup_requests enable row level security;

revoke all on public.signup_requests from anon, authenticated;
grant insert on public.signup_requests to anon;
grant select on public.signup_requests to authenticated;
grant all on public.signup_requests to service_role;

drop policy if exists "Anyone can submit a signup request" on public.signup_requests;
create policy "Anyone can submit a signup request" on public.signup_requests
  for insert to anon with check (status = 'pending' and processed_at is null and processed_by is null);

drop policy if exists "Admins can view signup requests" on public.signup_requests;
create policy "Admins can view signup requests" on public.signup_requests
  for select to authenticated using (
    exists (select 1 from public.admin_users where public.admin_users.user_id = (select auth.uid()))
  );
