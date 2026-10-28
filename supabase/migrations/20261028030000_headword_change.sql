-- BACKLOG #34 "Make this the headword" (spec 34 §18, v2 signed off 2026-10-28).
-- 1. A new internal type, headword_change: an admin makes it from an accepted community form; it has no
--    author (user_id null), so it never shows in anyone's contributions, caps, stats or notifications.
-- 2. review_transition: make_headword; admin-only actions on the type; the revert guards.
-- 3. fold_claimable: nothing else on an entry folds while its headword change is between claim and confirm.
-- 4. fold_mark: the new id is written back at in_preview (target_path), and the entry's rows follow it at
--    folded (and back at reverted), in the same transaction.

alter table public.contributions drop constraint contributions_type_check;
alter table public.contributions add constraint contributions_type_check check (type in (
  'word_addition', 'definition_update', 'example_sentence', 'spelling_variant', 'entry_flag',
  'proverb_addition', 'proverb_variant', 'proverb_meaning', 'proverb_context',
  'plant_name', 'plant_info', 'plant_addition', 'translation_fix', 'general_feedback', 'headword_change'));
-- A headword change never has an author (user_id is already nullable: erased contributors), so submit,
-- which always sets one, can never create one.
alter table public.contributions add constraint contributions_author_check
  check (type <> 'headword_change' or user_id is null);
-- Backstop for "one at a time per entry".
create unique index contributions_one_open_headword on public.contributions (target_id)
  where type = 'headword_change' and status = 'accepted' and (fold_status is distinct from 'folded' or live_status is distinct from 'live');

create or replace function private.fold_claimable(c public.contributions)
returns boolean language sql stable set search_path = '' as $$
  select c.status = 'accepted' and not c.is_test and c.type not in ('general_feedback', 'entry_flag')
    and c.target_type in ('plant', 'glossary', 'word', 'proverb', 'article', 'ui') and (
    (c.live_status = 'live' and (c.fold_status is null
       or (c.fold_status = 'folding' and c.fold_claimed_at < now() - interval '2 hours')))
    or (c.live_status = 'reverting' and (c.fold_status in ('folded', 'failed')
       or (c.fold_status = 'in_preview' and c.revert_requested_at > c.fold_claimed_at)
       or (c.fold_status = 'folding' and c.fold_claimed_at < now() - interval '2 hours'))))
    -- While an entry's headword change is being folded and not yet confirmed, the entry's other rows wait:
    -- the files may already have its new id while the rows still name the old one (spec 34 §18.4).
    and not (c.target_type = 'word' and c.type <> 'headword_change' and exists (
      select 1 from public.contributions h where h.type = 'headword_change' and h.status = 'accepted'
        and h.target_id = c.target_id and h.fold_status in ('folding', 'in_preview')));
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
  new_path text;
  fp jsonb := coalesce(p_args->'final_payload', '{}'::jsonb);
  hc public.contributions;
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
  -- A Swahili or Digo translation (a fix, or a section correction on a sw/dg page) is reviewed only by
  -- someone marked as reading that language (spec 34 §17, owner decision 5). Admins read every language.
  if not private.reads_language(p_uid, me.role, c) then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if c.user_id = p_uid then return jsonb_build_object('error', 'self_review'); end if;

  -- A headword change has no author: an admin makes it and only an admin acts on it, by reverting it or
  -- retrying a failed fold-in unchanged (spec 34 §18.1). Everything else about it is not acceptable.
  if c.type = 'headword_change' then
    if me.role <> 'admin' then return jsonb_build_object('error', 'forbidden'); end if;
    if p_action not in ('revert', 'retry_fold') or p_args ? 'final_payload' or p_args ? 'base' then
      return jsonb_build_object('error', 'not_acceptable');
    end if;
  end if;

  -- A reviewer may correct the text, never what a dictionary change points at (spec 34 §15.3).
  if p_args ? 'final_payload' and c.type in ('definition_update', 'example_sentence') and (
       fp->>'sense_id' is distinct from c.payload->>'sense_id'
       or (c.type = 'definition_update' and (fp->>'mode' is distinct from c.payload->>'mode' or fp->>'lang' is distinct from c.payload->>'lang'))) then
    return jsonb_build_object('error', 'locked_fields');
  end if;
  if p_args ? 'final_payload' and (
       (c.type = 'proverb_meaning' and (fp->>'lang' is distinct from c.payload->>'lang' or fp->>'kind' is distinct from c.payload->>'kind'
                                        or coalesce(fp->>'mode', 'replace') is distinct from coalesce(c.payload->>'mode', 'replace')))
       or (c.type = 'proverb_context' and fp->>'lang' is distinct from c.payload->>'lang')
       or (c.type = 'proverb_addition' and fp->>'usage_lang' is distinct from c.payload->>'usage_lang')
       -- A translation fix's block and language are what the reviewer checked against; they never change.
       or (c.type = 'translation_fix' and (fp->>'lang' is distinct from c.payload->>'lang' or fp->>'field' is distinct from c.payload->>'field'
                                           or fp->>'part' is distinct from c.payload->>'part' or fp->>'block' is distinct from c.payload->>'block'
                                           or fp->>'key' is distinct from c.payload->>'key'))) then
    return jsonb_build_object('error', 'locked_fields');
  end if;

  -- A new proverb's id is reserved at accept, under a lock, past every id ever reserved: never reused
  -- after a revert (spec 34 §16.9). Test rows keep their fixture target.
  if c.type = 'proverb_addition' and p_action in ('accept', 'accept_variant') and not c.is_test
     and coalesce(c.target_id, '') !~ '^p-[0-9]{3,4}$' then
    perform pg_advisory_xact_lock(hashtext('proverb-ids'));
    select greatest(coalesce((select (value #>> '{}')::int from public.app_settings where key = 'proverb_id_hwm'), 387),
                    coalesce((select max((substring(x.target_id from '^p-([0-9]{3,4})$'))::int) from public.contributions x
                              where x.type = 'proverb_addition' and x.target_id ~ '^p-[0-9]{3,4}$'), 0)) + 1
      into n;
    if n > 9999 then return jsonb_build_object('error', 'conflict'); end if;
    new_path := 'p-' || lpad(n::text, 3, '0');
  end if;

  -- A new sense's id is allocated here, once, under a lock per entry: past the shipped senses (the API's
  -- minimum) and past every sense id any accepted or reverted change on the entry ever took. Never reused.
  if c.type = 'definition_update' and c.payload->>'mode' = 'add_sense' and p_action in ('accept', 'retry_fold') then
    perform pg_advisory_xact_lock(hashtext('senses:' || coalesce(c.target_type, '') || ':' || coalesce(c.target_id, '')));
    select greatest(
             coalesce((substring(p_args->>'target_path' from '^senses\.([0-9]{1,3})$'))::int, 1),
             coalesce(max((substring(x.target_path from '^senses\.([0-9]{1,3})$'))::int) + 1, 1))
      into n
      from public.contributions x
     where x.target_type = c.target_type and x.target_id = c.target_id and x.type = 'definition_update'
       and x.status in ('accepted', 'reverted') and x.id <> c.id and x.target_path ~ '^senses\.[0-9]{1,3}$';
    if n > 999 then return jsonb_build_object('error', 'conflict'); end if;
    new_path := 'senses.' || n;
  end if;

  select coalesce((value #>> '{}')::boolean, false) into paused from public.app_settings where key = 'publishing_paused';

  if p_action = 'make_headword' then
    -- Make an accepted community form the entry's headword (spec 34 §18.1). One at a time per entry,
    -- under a lock; the form is copied from the accepted variant, never typed; the API computes the base.
    if me.role <> 'admin' then return jsonb_build_object('error', 'forbidden'); end if;
    perform pg_advisory_xact_lock(hashtext('headword:' || coalesce(c.target_id, '')));
    select * into c from public.contributions where id = p_cid for update;
    if c.type <> 'spelling_variant' or c.status <> 'accepted' or c.live_status is distinct from 'live'
       or c.target_type is distinct from 'word' or coalesce(c.target_id, '') = '' or c.target_id like 'c:%'
       or (c.is_test <> (c.target_id = '__test__')) then
      return jsonb_build_object('error', 'not_acceptable');
    end if;
    if coalesce(jsonb_typeof(p_args->'base'->'value'), '') <> 'object' or coalesce(c.final_payload->>'form', '') = '' then
      return jsonb_build_object('error', 'invalid');
    end if;
    if exists (select 1 from public.contributions x where x.type = 'headword_change' and x.status = 'accepted'
               and (x.final_payload->>'variant' = c.id::text
                    or (x.target_id = c.target_id and (x.fold_status is distinct from 'folded' or x.live_status is distinct from 'live')))) then
      return jsonb_build_object('error', 'headword_open');
    end if;
    insert into public.contributions (user_id, type, scope, target_type, target_id, target_label, payload, final_payload, base,
                                      credit_opt_in, locale, status, reviewer_id, reviewed_at, live_status, is_test)
    values (null, 'headword_change', 'dictionary', 'word', c.target_id, c.target_label,
            jsonb_build_object('form', c.final_payload->>'form', 'variant', c.id::text),
            jsonb_build_object('form', c.final_payload->>'form', 'variant', c.id::text),
            jsonb_build_object('value', p_args->'base'->'value'),
            false, 'en', 'accepted', p_uid, now(), case when paused and not c.is_test then 'paused' else 'live' end, c.is_test)
    returning * into hc;
    perform private.log_event(p_uid, 'make_headword', hc.id, null, jsonb_build_object('variant', c.id), c.is_test);
    return jsonb_build_object('ok', true, 'id', hc.id, 'status', hc.status, 'live_status', hc.live_status, 'target_type', hc.target_type,
                              'target_id', hc.target_id, 'is_test', hc.is_test);

  elsif p_action = 'claim' then
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
    -- Interface text: two voices always, enforced here too, not only by the API (spec 34 §17.12).
    live := case when coalesce((p_args->>'needs_second')::boolean, false) or c.target_type = 'ui' then 'awaiting_second'
                 when paused and not c.is_test then 'paused' else 'live' end;
    update public.contributions
    set status = 'accepted', reviewer_id = p_uid, reviewed_at = now(),
        final_payload = coalesce(p_args->'final_payload', payload), review_note = p_args->>'note',
        outcome = case when p_action = 'accept_variant' then 'variant' else 'replace' end,
        live_status = live, claimed_by = null, claimed_until = null,
        -- A new sense gets its id once, at accept (allocated by the API, never reused).
        target_path = case when c.type = 'proverb_addition' then target_path else coalesce(new_path, target_path) end,
        target_id = case when c.type = 'proverb_addition' and new_path is not null then new_path else target_id end
    where id = p_cid and status in ('pending', 'needs_info')
      and (claimed_by is null or claimed_until < now() or claimed_by = p_uid)
    returning * into c;
    ok := found;
    if ok then
      -- The new proverb's id is spent only once the accept has gone through.
      if c.type = 'proverb_addition' and new_path is not null then
        insert into public.app_settings (key, value) values ('proverb_id_hwm', to_jsonb((substring(new_path from 3))::int))
          on conflict (key) do update set value = excluded.value, updated_at = now();
      end if;
      -- Merge duplicates that say the same thing; their authors are credited as agreeing.
      update public.contributions set status = 'duplicate', duplicate_of = p_cid, reviewer_id = p_uid, reviewed_at = now()
      where id in (select (jsonb_array_elements_text(coalesce(p_args->'merge_ids', '[]'::jsonb)))::uuid)
        and id <> p_cid and status in ('pending', 'needs_info') and scope = c.scope
        -- Only the same kind of change (never flags or feedback); new words only with the same headword.
        and type = c.type and type not in ('entry_flag', 'general_feedback')
        and (c.type <> 'word_addition' or lower(payload->>'headword') = lower(coalesce(c.final_payload, c.payload)->>'headword'))
        and (c.type <> 'proverb_addition' or regexp_replace(lower(payload->>'digo'), '[^a-z ]', '', 'g')
                                              = regexp_replace(lower(coalesce(c.final_payload, c.payload)->>'digo'), '[^a-z ]', '', 'g'))
        and target_type is not distinct from c.target_type and is_test = c.is_test
        -- (a new proverb has just been given its reserved id; its duplicates have none yet)
        and (target_id is not distinct from c.target_id or (c.type = 'proverb_addition' and target_id is null))
        and user_id is distinct from p_uid
        and (claimed_by is null or claimed_until < now() or claimed_by = p_uid);
      -- A contributor's first accept releases their held suggestions.
      update public.contributions set held = false where user_id = c.user_id and held;
      if c.user_id is not null then
        insert into public.notifications (user_id, kind, contribution_id) values (c.user_id, 'accepted', p_cid);
      end if;
    end if;

  elsif p_action = 'resolve' then
    if coalesce(btrim(p_args->>'note'), '') = '' then return jsonb_build_object('error', 'note_required'); end if;
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
    -- A headword change is undone only when settled in the files, newest first; a form that became the
    -- headword stays until that change is undone (spec 34 §18.1).
    if c.type = 'headword_change' and c.fold_status in ('folding', 'in_preview') then
      return jsonb_build_object('error', 'folding');
    end if;
    if (c.type = 'headword_change' and exists (select 1 from public.contributions x where x.type = 'headword_change'
          and x.status = 'accepted' and x.id <> c.id and x.target_id = c.target_id and x.reviewed_at > c.reviewed_at))
       or (c.type = 'spelling_variant' and exists (select 1 from public.contributions x where x.type = 'headword_change'
          and x.status = 'accepted' and x.final_payload->>'variant' = c.id::text)) then
      return jsonb_build_object('error', 'has_dependants');
    end if;
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
    if ok and c.type = 'proverb_addition' and c.status = 'reverted' and c.target_id ~ '^p-[0-9]{3,4}$' then
      perform private.close_suggestions_on(c.target_id, p_uid);
    end if;

  elsif p_action = 'retry_fold' then
    update public.contributions set fold_status = null, fold_error = null, fold_nonce = null,
      live_status = case
        when p_args ? 'final_payload' and p_args->'final_payload' is distinct from final_payload then 'awaiting_second'
        -- An interface fix moved onto newer text replaces approved text: a second voice again.
        when target_type = 'ui' and p_args ? 'base' then 'awaiting_second'
        when live_status = 'conflict' then (case when paused and not is_test then 'paused' else 'live' end)
        else live_status end,
      final_payload = coalesce(p_args->'final_payload', final_payload),
      base = coalesce(p_args->'base', base),
      target_path = case when live_status = 'conflict' and new_path is not null then new_path else target_path end,
      -- Whoever edits the accepted text becomes its reviewer, so someone else must confirm it.
      reviewer_id = case when (target_type = 'ui' and p_args ? 'base') or p_args ? 'final_payload' and p_args->'final_payload' is distinct from final_payload
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

create or replace function private.retarget_word(p_old text, p_new text, p_test boolean)
returns void language sql security definer set search_path = '' as $$
  -- Entry ids are unique and a former id stays reserved (spec 34 §18.4), so every row on the old id is
  -- this entry's.
  update public.contributions set target_id = p_new
   where target_type = 'word' and target_id = p_old and is_test = p_test
     and p_new ~ '^[a-z'' áéíóú_-]+(\.[0-9]{1,3})?$';
$$;
revoke execute on function private.retarget_word(text, text, boolean) from public, anon, authenticated;

create or replace function public.fold_mark(p_token text, p_nonce uuid, p_ids uuid[], p_state text,
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
            replace(regexp_replace(lower(normalize(coalesce(c.final_payload, c.payload)->>'headword', NFC)), '^-', ''), '’', '''');
      -- A headword change's new id, kept in target_path until it is confirmed: the form's sort key with an
      -- optional .N (spec 34 §18.4).
      update public.contributions c set target_path = t.value #>> '{}'
      from jsonb_each(p_target_ids) t
      where c.id::text = t.key and c.id = any(p_ids) and c.fold_nonce = p_nonce and c.fold_status = 'in_preview'
        and c.type = 'headword_change' and c.live_status = 'live'
        and jsonb_typeof(t.value) = 'string' and length(t.value #>> '{}') <= 80
        and (t.value #>> '{}') ~ '^[a-z'' áéíóú_-]+(\.[0-9]{1,3})?$'
        and regexp_replace(t.value #>> '{}', '\.[0-9]+$', '') =
            replace(regexp_replace(lower(normalize(c.final_payload->>'form', NFC)), '^-', ''), '’', '''');
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
    -- A confirmed headword change: every row on the entry follows it to its new id (spec 34 §18.4).
    perform private.retarget_word(h.target_id, h.target_path, h.is_test)
      from public.contributions h
     where h.id = any(p_ids) and h.type = 'headword_change' and h.fold_status = 'in_preview' and h.live_status = 'live'
       and h.target_path is not null and h.target_path <> h.target_id;
    update public.contributions set fold_status = 'folded', folded_sha = p_sha, folded_at = now()
    where id = any(p_ids) and fold_status = 'in_preview' and live_status = 'live';
  elsif p_state = 'reverted' then
    -- An undone headword change that had moved the entry: its rows go back to the old id.
    perform private.retarget_word(h.target_id, h.base->'value'->>'id', h.is_test)
      from public.contributions h
     where h.id = any(p_ids) and h.type = 'headword_change' and h.fold_status = 'in_preview' and h.live_status = 'reverting'
       and h.fold_claimed_at >= h.revert_requested_at and h.target_path is not null
       and h.target_id = h.target_path and coalesce(h.base->'value'->>'id', '') <> '' and h.base->'value'->>'id' <> h.target_id;
    update public.contributions set status = 'reverted', live_status = null, fold_status = 'folded',
      folded_sha = p_sha, folded_at = now(),
      -- A reverted new word's id is free again; the row no longer points at it. A new proverb keeps its
      -- reserved id (ids are never reused), and open suggestions on it are closed below.
      target_id = case when type = 'word_addition' then null else target_id end
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
  if p_state = 'reverted' then
    perform private.close_suggestions_on(x.target_id, null)
      from public.contributions x
     where x.id = any(p_ids) and x.type = 'proverb_addition' and x.status = 'reverted' and x.target_id ~ '^p-[0-9]{3,4}$';
  end if;
  if n > 0 then
    insert into public.contribution_events (action, details)
    values ('fold_' || p_state, jsonb_build_object('count', n, 'pr', p_pr, 'sha', p_sha));
  end if;
  return n;
end;
$$;

