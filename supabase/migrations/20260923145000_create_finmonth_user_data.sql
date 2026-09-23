create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_months (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  data jsonb not null default '{"incomes":[],"bills":[],"savings":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

alter table public.profiles enable row level security;
alter table public.finance_months enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.finance_months from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.finance_months to authenticated;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own finance months"
on public.finance_months for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own finance months"
on public.finance_months for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own finance months"
on public.finance_months for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own finance months"
on public.finance_months for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace trigger finance_months_set_updated_at
before update on public.finance_months
for each row execute procedure public.set_updated_at();
