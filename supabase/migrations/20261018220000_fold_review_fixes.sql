-- Spec 34 phase 2b review fixes.
-- 1. A revert is marked reverted only after the revert itself was folded (not by a deploy that simply
--    predates the change reaching main).
-- 2. Fold-in only claims plant changes until the other areas have appliers (phases 3-5), so it doesn't
--    claim and release them on every run.
-- 3. "Fold in now" stays requested only until the next claim, not for a whole day.

create or replace function private.fold_claimable(c public.contributions)
returns boolean language sql stable set search_path = '' as $$
  select c.status = 'accepted' and not c.is_test and c.type not in ('general_feedback', 'entry_flag')
    and c.target_type = 'plant' and (
    (c.live_status = 'live' and (c.fold_status is null
       or (c.fold_status = 'folding' and c.fold_claimed_at < now() - interval '2 hours')))
    or (c.live_status = 'reverting' and (c.fold_status in ('folded', 'failed')
       or (c.fold_status = 'in_preview' and c.revert_requested_at > c.fold_claimed_at)
       or (c.fold_status = 'folding' and c.fold_claimed_at < now() - interval '2 hours'))));
$$;

create or replace function public.fold_requested()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> '{}')::timestamptz from public.app_settings where key = 'fold_requested_at')
                  > greatest(now() - interval '1 day',
                             coalesce((select max(created_at) from public.contribution_events where action = 'fold_claim'),
                                      '-infinity'::timestamptz)), false)
     and exists (select 1 from public.contributions c where private.fold_claimable(c));
$$;

create or replace function public.fold_mark(p_token text, p_nonce uuid, p_ids uuid[], p_state text,
                                            p_pr int default null, p_sha text default null, p_error text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare n int := 0;
begin
  if not private.fold_token_ok(p_token) then raise exception 'invalid token'; end if;

  if p_state = 'in_preview' then
    update public.contributions set fold_status = 'in_preview', fold_pr = p_pr
    where id = any(p_ids) and fold_status = 'folding' and fold_nonce = p_nonce;
  elsif p_state = 'failed' then
    update public.contributions set fold_status = 'failed', fold_error = left(p_error, 2000)
    where id = any(p_ids) and fold_status = 'folding' and fold_nonce = p_nonce;
  elsif p_state = 'conflict' then
    update public.contributions set fold_status = null, live_status = 'conflict', fold_error = left(p_error, 2000)
    where id = any(p_ids) and fold_status = 'folding' and fold_nonce = p_nonce and live_status = 'live';
  elsif p_state = 'release' then
    update public.contributions set fold_status = fold_prev, fold_nonce = null
    where id = any(p_ids) and fold_status = 'folding' and fold_nonce = p_nonce;
  elsif p_state = 'folded' then
    update public.contributions set fold_status = 'folded', folded_sha = p_sha, folded_at = now()
    where id = any(p_ids) and fold_status = 'in_preview' and live_status = 'live';
  elsif p_state = 'reverted' then
    update public.contributions set status = 'reverted', live_status = null, fold_status = 'folded',
      folded_sha = p_sha, folded_at = now()
    -- Only once the revert itself went through fold-in (claimed after it was asked for). Until then the
    -- change is still in preview, and a deploy that lacks it proves nothing.
    where id = any(p_ids) and fold_status = 'in_preview' and live_status = 'reverting'
      and fold_claimed_at >= revert_requested_at;
  elsif p_state = 'fold_failed' then
    insert into public.contribution_events (action, details) values ('fold_failed', jsonb_build_object('error', left(p_error, 2000)));
    insert into public.notifications (user_id, kind)
    select id, 'fold_failed' from public.profiles where role = 'admin' and deleted_at is null and blocked_at is null;
    return 0;
  else
    raise exception 'invalid state';
  end if;
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.contribution_events (action, details)
    values ('fold_' || p_state, jsonb_build_object('count', n, 'pr', p_pr, 'sha', p_sha));
  end if;
  return n;
end;
$$;
