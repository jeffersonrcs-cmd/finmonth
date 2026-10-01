alter table public.signup_requests
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists approval_email_sent_at timestamptz,
  add column if not exists approval_email_error text;

create unique index if not exists signup_requests_auth_user_id_uidx
  on public.signup_requests (auth_user_id)
  where auth_user_id is not null;

alter table public.signup_requests
  drop constraint if exists signup_requests_email_normalized_check;

alter table public.signup_requests
  add constraint signup_requests_email_normalized_check
  check (email = lower(btrim(email)));
