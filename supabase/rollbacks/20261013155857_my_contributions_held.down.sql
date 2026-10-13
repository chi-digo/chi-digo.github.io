drop view public.my_contributions;
create view public.my_contributions with (security_invoker = false) as
select
  id, type, scope, target_type, target_id, target_path, target_label, payload, note, region, village,
  confidence, credit_opt_in, recorded_for, locale, page_path, status, review_note, reply, outcome,
  live_status, fold_status, folded_at, agree_count, created_at, updated_at, reviewed_at
from public.contributions
where user_id = auth.uid();
revoke all on public.my_contributions from anon, authenticated;
grant select on public.my_contributions to authenticated;
