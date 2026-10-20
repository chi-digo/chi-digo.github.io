-- Spec 34 phase 3b: dictionary contributions.
-- 1. A 'resolved' status: flags and feedback are closed with resolve or decline, never accepted.
-- 2. submit_contribution: at most 10 new words a day per person.
-- 3. review_transition: no accept for flags and feedback; an add_sense gets its sense id at accept; resolve.
-- 4. Fold-in claims word changes as well as plant changes.
-- 5. fold_mark('in_preview') can write back the real id of a folded new word, under strict limits.

alter table public.contributions drop constraint if exists contributions_status_check;
alter table public.contributions add constraint contributions_status_check
  check (status in ('pending', 'needs_info', 'accepted', 'declined', 'duplicate', 'withdrawn', 'reverted', 'resolved'));

create or replace function public.submit_contribution(p_uid uuid, p_row jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  prof record;
  account_created timestamptz;
  test boolean;
  is_new boolean;
  n int;
  accepted int;
  new_id uuid;
  is_held boolean;
begin
  select * into prof from public.profiles where id = p_uid;
  if prof.id is null or prof.deleted_at is not null then return jsonb_build_object('error', 'unauthorized'); end if;
  if prof.blocked_at is not null then return jsonb_build_object('error', 'blocked'); end if;

  perform pg_advisory_xact_lock(hashtext('contrib:' || p_uid::text));

  select u.created_at, coalesce((u.raw_app_meta_data->>'test')::boolean, false)
    into account_created, test from auth.users u where u.id = p_uid;
  is_new := account_created > now() - interval '24 hours';

  select count(*) into n from public.contributions where user_id = p_uid and created_at > now() - interval '1 day';
  if n >= (case when is_new then 5 else 30 end) then return jsonb_build_object('error', 'limit_day'); end if;

  if p_row->>'target_id' is not null then
    select count(*) into n from public.contributions
    where user_id = p_uid and target_type = p_row->>'target_type' and target_id = p_row->>'target_id'
      and status in ('pending', 'needs_info');
    if n >= 5 then return jsonb_build_object('error', 'limit_target'); end if;
  end if;

  -- At most 10 new words a day per person (spec 34 §15.3), on top of the other limits.
  if p_row->>'type' = 'word_addition' then
    select count(*) into n from public.contributions
    where user_id = p_uid and type = 'word_addition' and created_at > now() - interval '1 day';
    if n >= 10 then return jsonb_build_object('error', 'limit_words'); end if;
  end if;

  select count(*) filter (where status = 'accepted'), count(*) into accepted, n
  from public.contributions where user_id = p_uid;
  is_held := accepted = 0 and n < 3;

  insert into public.contributions (
    user_id, type, scope, target_type, target_id, target_path, target_label, payload, note, region, village,
    confidence, credit_opt_in, recorded_for, locale, page_path, data_version, base, held, is_test)
  values (
    p_uid, p_row->>'type', p_row->>'scope', p_row->>'target_type', p_row->>'target_id', p_row->>'target_path',
    p_row->>'target_label', p_row->'payload', p_row->>'note', p_row->>'region', p_row->>'village',
    p_row->>'confidence', coalesce((p_row->>'credit_opt_in')::boolean, false), p_row->'recorded_for',
    p_row->>'locale', p_row->>'page_path', p_row->>'data_version', p_row->'base', is_held, test)
  returning id into new_id;

  perform private.log_event(p_uid, 'submit', new_id, null, jsonb_build_object('type', p_row->>'type'), test);
  return jsonb_build_object('id', new_id, 'held', is_held, 'is_test', test);
end;
$$;

create or replace function public.review_transition(p_uid uuid, p_cid uuid, p_action text, p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me record;
  c public.contributions;
  is_reviewer boolean;
  paused boolean;
  n int;
  live text;
  ok boolean := false;
begin
  select * into me from public.profiles where id = p_uid;
  if me.id is null or me.deleted_at is not null or me.blocked_at is not null then
    return jsonb_build_object('error', 'forbidden');
  end if;

  select * into c from public.contributions where id = p_cid;
  if c.id is null then return jsonb_build_object('error', 'not_found'); end if;

  is_reviewer := me.role = 'admin' or (me.role = 'reviewer' and exists (
    select 1 from public.profile_review_scopes s where s.user_id = p_uid and (s.scope = c.scope or s.scope = 'all')));
  if not is_reviewer then return jsonb_build_object('error', 'forbidden'); end if;
  if c.user_id = p_uid then return jsonb_build_object('error', 'self_review'); end if;

  select coalesce((value #>> '{}')::boolean, false) into paused from public.app_settings where key = 'publishing_paused';

  if p_action = 'claim' then
    update public.contributions set claimed_by = p_uid, claimed_until = now() + interval '30 minutes'
    where id = p_cid and status in ('pending', 'needs_info')
      and (claimed_by is null or claimed_until < now() or claimed_by = p_uid)
    returning * into c;
    ok := found;

  elsif p_action = 'release' then
    update public.contributions set claimed_by = null, claimed_until = null
    where id = p_cid and claimed_by = p_uid returning * into c;
    ok := found;

  elsif p_action in ('accept', 'accept_variant') then
    -- Flags and feedback are never published: they are resolved or declined (spec 34 §15.3).
    if c.type in ('entry_flag', 'general_feedback') then return jsonb_build_object('error', 'not_acceptable'); end if;
    select count(*) into n from public.contribution_events
    where actor_id = p_uid and action in ('accept', 'accept_variant') and created_at > now() - interval '1 hour';
    if n >= 60 then return jsonb_build_object('error', 'rate_cap'); end if;
    live := case when coalesce((p_args->>'needs_second')::boolean, false) then 'awaiting_second'
                 when paused and not c.is_test then 'paused' else 'live' end;
    update public.contributions
    set status = 'accepted', reviewer_id = p_uid, reviewed_at = now(),
        final_payload = coalesce(p_args->'final_payload', payload), review_note = p_args->>'note',
        outcome = case when p_action = 'accept_variant' then 'variant' else 'replace' end,
        live_status = live, claimed_by = null, claimed_until = null,
        -- A new sense gets its id once, at accept (allocated by the API, never reused).
        target_path = case when c.type = 'definition_update' and c.payload->>'mode' = 'add_sense'
                             and p_args->>'target_path' ~ '^senses\.[0-9]{1,3}$'
                           then p_args->>'target_path' else target_path end
    where id = p_cid and status in ('pending', 'needs_info')
      and (claimed_by is null or claimed_until < now() or claimed_by = p_uid)
    returning * into c;
    ok := found;
    if ok then
      -- Merge duplicates that say the same thing; their authors are credited as agreeing.
      update public.contributions set status = 'duplicate', duplicate_of = p_cid, reviewer_id = p_uid, reviewed_at = now()
      where id in (select (jsonb_array_elements_text(coalesce(p_args->'merge_ids', '[]'::jsonb)))::uuid)
        and id <> p_cid and status in ('pending', 'needs_info') and scope = c.scope
        and target_type is not distinct from c.target_type and target_id is not distinct from c.target_id
        and user_id is distinct from p_uid
        and (claimed_by is null or claimed_until < now() or claimed_by = p_uid);
      -- A contributor's first accept releases their held suggestions.
      update public.contributions set held = false where user_id = c.user_id and held;
      if c.user_id is not null then
        insert into public.notifications (user_id, kind, contribution_id) values (c.user_id, 'accepted', p_cid);
      end if;
    end if;

  elsif p_action = 'resolve' then
    -- A flag or feedback that was acted on (an admin fixed the data; the note says how).
    update public.contributions
    set status = 'resolved', reviewer_id = p_uid, reviewed_at = now(), review_note = p_args->>'note',
        claimed_by = null, claimed_until = null
    where id = p_cid and type in ('entry_flag', 'general_feedback') and status in ('pending', 'needs_info')
      and (claimed_by is null or claimed_until < now() or claimed_by = p_uid)
    returning * into c;
    ok := found;

  elsif p_action in ('needs_info', 'decline') then
    update public.contributions
    set status = case when p_action = 'decline' then 'declined' else 'needs_info' end,
        reviewer_id = p_uid, reviewed_at = now(), review_note = p_args->>'note', claimed_by = null, claimed_until = null
    where id = p_cid and status in ('pending', 'needs_info')
      and (claimed_by is null or claimed_until < now() or claimed_by = p_uid)
    returning * into c;
    ok := found;
    if ok and c.user_id is not null then
      insert into public.notifications (user_id, kind, contribution_id)
      values (c.user_id, case when p_action = 'decline' then 'declined' else 'needs_info' end, p_cid);
    end if;

  elsif p_action = 'duplicate' then
    update public.contributions
    set status = 'duplicate', duplicate_of = (p_args->>'duplicate_of')::uuid, reviewer_id = p_uid, reviewed_at = now(),
        review_note = p_args->>'note', claimed_by = null, claimed_until = null
    where id = p_cid and status in ('pending', 'needs_info') and (p_args->>'duplicate_of')::uuid <> p_cid
      and (claimed_by is null or claimed_until < now() or claimed_by = p_uid)
      and exists (select 1 from public.contributions d where d.id = (p_args->>'duplicate_of')::uuid
                  and d.target_type is not distinct from c.target_type and d.target_id is not distinct from c.target_id)
    returning * into c;
    ok := found;

  elsif p_action = 'second_confirm' then
    update public.contributions
    set live_status = case when paused and not c.is_test then 'paused' else 'live' end, second_reviewer_id = p_uid, second_reviewed_at = now()
    where id = p_cid and status = 'accepted' and live_status = 'awaiting_second' and reviewer_id <> p_uid
    returning * into c;
    ok := found;

  elsif p_action = 'second_reject' then
    update public.contributions
    set status = 'pending', live_status = null, reviewer_id = null, reviewed_at = null, final_payload = null,
        outcome = null, review_note = p_args->>'note'
    where id = p_cid and status = 'accepted' and live_status = 'awaiting_second' and reviewer_id <> p_uid
    returning * into c;
    ok := found;

  elsif p_action = 'revert' then
    if me.role <> 'admin' then return jsonb_build_object('error', 'forbidden'); end if;
    update public.contributions
    set status = case when fold_status is null then 'reverted' else status end,
        live_status = case when fold_status is null then null else 'reverting' end,
        revert_requested_at = case when fold_status is null then null else now() end
    where id = p_cid and status = 'accepted' and coalesce(live_status, '') <> 'reverting'
    returning * into c;
    ok := found;
    if ok and c.user_id is not null then
      insert into public.notifications (user_id, kind, contribution_id) values (c.user_id, 'reverted', p_cid);
    end if;

  elsif p_action = 'retry_fold' then
    update public.contributions set fold_status = null, fold_error = null, fold_nonce = null,
      live_status = case
        when p_args ? 'final_payload' and p_args->'final_payload' is distinct from final_payload then 'awaiting_second'
        when live_status = 'conflict' then (case when paused and not is_test then 'paused' else 'live' end)
        else live_status end,
      final_payload = coalesce(p_args->'final_payload', final_payload),
      base = coalesce(p_args->'base', base),
      -- Whoever edits the accepted text becomes its reviewer, so someone else must confirm it.
      reviewer_id = case when p_args ? 'final_payload' and p_args->'final_payload' is distinct from final_payload
                         then p_uid else reviewer_id end,
      reviewed_at = case when p_args ? 'final_payload' and p_args->'final_payload' is distinct from final_payload
                         then now() else reviewed_at end
    where id = p_cid and status = 'accepted' and coalesce(live_status, '') <> 'reverting'
      and (fold_status = 'failed' or live_status = 'conflict')
    returning * into c;
    ok := found;

  else
    return jsonb_build_object('error', 'bad_action');
  end if;

  if not ok then return jsonb_build_object('error', 'conflict'); end if;
  perform private.log_event(p_uid, p_action, p_cid, c.user_id, nullif(p_args - 'final_payload' - 'base', '{}'::jsonb), c.is_test);
  return jsonb_build_object('ok', true, 'status', c.status, 'live_status', c.live_status, 'target_type', c.target_type,
                            'target_id', c.target_id, 'user_id', c.user_id, 'locale', c.locale, 'is_test', c.is_test);
end;
$$;

create or replace function private.fold_claimable(c public.contributions)
returns boolean language sql stable set search_path = '' as $$
  select c.status = 'accepted' and not c.is_test and c.type not in ('general_feedback', 'entry_flag')
    and c.target_type in ('plant', 'word') and (
    (c.live_status = 'live' and (c.fold_status is null
       or (c.fold_status = 'folding' and c.fold_claimed_at < now() - interval '2 hours')))
    or (c.live_status = 'reverting' and (c.fold_status in ('folded', 'failed')
       or (c.fold_status = 'in_preview' and c.revert_requested_at > c.fold_claimed_at)
       or (c.fold_status = 'folding' and c.fold_claimed_at < now() - interval '2 hours'))));
$$;

drop function if exists public.fold_mark(text, uuid, uuid[], text, int, text, text);
create function public.fold_mark(p_token text, p_nonce uuid, p_ids uuid[], p_state text,
                                 p_pr int default null, p_sha text default null, p_error text default null,
                                 p_target_ids jsonb default null)
returns int language plpgsql security definer set search_path = '' as $$
declare n int := 0;
begin
  if not private.fold_token_ok(p_token) then raise exception 'invalid token'; end if;

  if p_state = 'in_preview' then
    update public.contributions set fold_status = 'in_preview', fold_pr = p_pr
    where id = any(p_ids) and fold_status = 'folding' and fold_nonce = p_nonce;
    get diagnostics n = row_count;
    -- The real id of a folded new word: only rows in this run, still folding until just now, new words
    -- with no id yet, listed in p_ids, and a value that is the word's sort key with an optional .N.
    if p_target_ids is not null and jsonb_typeof(p_target_ids) = 'object' then
      update public.contributions c set target_id = t.value #>> '{}'
      from jsonb_each(p_target_ids) t
      where c.id::text = t.key and c.id = any(p_ids) and c.fold_nonce = p_nonce and c.fold_status = 'in_preview'
        and c.type = 'word_addition' and c.target_id is null
        and jsonb_typeof(t.value) = 'string' and length(t.value #>> '{}') <= 80
        and (t.value #>> '{}') ~ '^[a-z'' áéíóú_-]+(\.[0-9]{1,3})?$'
        and regexp_replace(t.value #>> '{}', '\.[0-9]+$', '') =
            replace(regexp_replace(lower(normalize(c.payload->>'headword', NFC)), '^-', ''), '’', '''');
    end if;
  elsif p_state = 'failed' then
    update public.contributions set fold_status = 'failed', fold_error = left(p_error, 2000),
      target_id = case when type = 'word_addition' and live_status = 'live' then null else target_id end
    where id = any(p_ids) and fold_status = 'folding' and fold_nonce = p_nonce;
  elsif p_state = 'conflict' then
    update public.contributions set fold_status = null, live_status = 'conflict', fold_error = left(p_error, 2000),
      target_id = case when type = 'word_addition' then null else target_id end
    where id = any(p_ids) and fold_status = 'folding' and fold_nonce = p_nonce and live_status = 'live';
  elsif p_state = 'release' then
    update public.contributions set fold_status = fold_prev, fold_nonce = null,
      target_id = case when type = 'word_addition' and fold_prev is null then null else target_id end
    where id = any(p_ids) and fold_status = 'folding' and fold_nonce = p_nonce;
  elsif p_state = 'folded' then
    update public.contributions set fold_status = 'folded', folded_sha = p_sha, folded_at = now()
    where id = any(p_ids) and fold_status = 'in_preview' and live_status = 'live';
  elsif p_state = 'reverted' then
    update public.contributions set status = 'reverted', live_status = null, fold_status = 'folded',
      folded_sha = p_sha, folded_at = now()
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
  if p_state <> 'in_preview' then get diagnostics n = row_count; end if;
  if n > 0 then
    insert into public.contribution_events (action, details)
    values ('fold_' || p_state, jsonb_build_object('count', n, 'pr', p_pr, 'sha', p_sha));
  end if;
  return n;
end;
$$;

revoke execute on function public.fold_mark(text, uuid, uuid[], text, int, text, text, jsonb) from public;
grant execute on function public.fold_mark(text, uuid, uuid[], text, int, text, text, jsonb) to anon, service_role;
revoke execute on function public.submit_contribution(uuid, jsonb), public.review_transition(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_contribution(uuid, jsonb), public.review_transition(uuid, uuid, text, jsonb)
  to service_role;
