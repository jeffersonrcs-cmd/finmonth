alter table public.signup_requests
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists signup_requests_auth_user_id_uidx
  on public.signup_requests (auth_user_id)
  where auth_user_id is not null;
