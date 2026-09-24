alter table public.profiles
  add column if not exists fin_ai_usage_date date,
  add column if not exists fin_ai_usage_count integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_fin_ai_usage_count_check;

alter table public.profiles
  add constraint profiles_fin_ai_usage_count_check
  check (fin_ai_usage_count between 0 and 20);

create or replace function public.get_fin_ai_quota()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  current_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (id, full_name, theme)
  values (current_user_id, '', 'dark')
  on conflict (id) do nothing;

  select case
    when fin_ai_usage_date = today then fin_ai_usage_count
    else 0
  end
  into current_count
  from public.profiles
  where id = current_user_id;

  return jsonb_build_object(
    'allowed', current_count < 20,
    'count', current_count,
    'remaining', greatest(20 - current_count, 0),
    'limit', 20
  );
end;
$$;

create or replace function public.consume_fin_ai_quota()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  current_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (id, full_name, theme)
  values (current_user_id, '', 'dark')
  on conflict (id) do nothing;

  update public.profiles
  set
    fin_ai_usage_date = today,
    fin_ai_usage_count = case
      when fin_ai_usage_date is distinct from today then 1
      else fin_ai_usage_count + 1
    end
  where id = current_user_id
    and (
      fin_ai_usage_date is distinct from today
      or fin_ai_usage_count < 20
    )
  returning fin_ai_usage_count into current_count;

  if current_count > 0 then
    return jsonb_build_object(
      'allowed', true,
      'count', current_count,
      'remaining', greatest(20 - current_count, 0),
      'limit', 20
    );
  end if;

  select case
    when fin_ai_usage_date = today then fin_ai_usage_count
    else 0
  end
  into current_count
  from public.profiles
  where id = current_user_id;

  return jsonb_build_object(
    'allowed', false,
    'count', current_count,
    'remaining', greatest(20 - current_count, 0),
    'limit', 20
  );
end;
$$;

revoke all on function public.get_fin_ai_quota() from public;
grant execute on function public.get_fin_ai_quota() to authenticated;

revoke all on function public.consume_fin_ai_quota() from public;
grant execute on function public.consume_fin_ai_quota() to authenticated;
