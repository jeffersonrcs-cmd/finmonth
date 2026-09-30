create index if not exists signup_requests_processed_by_idx
  on public.signup_requests (processed_by);

alter table public.signup_requests
  drop constraint if exists signup_requests_email_normalized_check;

alter table public.signup_requests
  add constraint signup_requests_email_normalized_check
  check (email = lower(btrim(email)));
