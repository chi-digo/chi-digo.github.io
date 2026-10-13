create or replace view public.contribution_credits with (security_invoker = false) as
select
  c.id,
  (c.credit_opt_in and p.id is not null and p.deleted_at is null and p.blocked_at is null) as credited,
  case when c.credit_opt_in and p.deleted_at is null and p.blocked_at is null then p.first_name end as first_name,
  case when c.credit_opt_in and p.deleted_at is null and p.blocked_at is null then p.avatar_url end as avatar_url,
  c.region,
  case when c.credit_opt_in and p.deleted_at is null and p.blocked_at is null then c.recorded_for->>'name' end as recorded_for_name,
  case when c.credit_opt_in and c.recorded_for is not null and p.deleted_at is null and p.blocked_at is null then p.first_name end as recorder_first_name
from public.contributions c
left join public.profiles p on p.id = c.user_id
where c.status = 'accepted' and not c.is_test;

revoke all on public.contribution_credits from anon, authenticated;
