revoke all on function public.get_fin_ai_quota() from anon, public;
revoke all on function public.consume_fin_ai_quota() from anon, public;
revoke all on function public.delete_current_user() from anon, public;

grant execute on function public.get_fin_ai_quota() to authenticated;
grant execute on function public.consume_fin_ai_quota() to authenticated;
grant execute on function public.delete_current_user() to authenticated;
