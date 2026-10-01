alter table public.signup_requests
  drop constraint if exists signup_requests_auth_user_id_fkey;

alter table public.signup_requests
  add constraint signup_requests_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete set null;

alter table public.signup_requests
  add column if not exists approval_email_sent_at timestamptz,
  add column if not exists approval_email_error text;
