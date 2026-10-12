-- Spec 34 v3 (technical spec v2.1 §2): anonymous public suggestions, regions and variants, the
-- live overlay and fold-in states, reports, notifications, an append-only log, and hardened access.
-- Every write goes through the API (service role) or the token-guarded fold-in functions.

-- 0. The public view depends on columns changed below; it is recreated in section 9.
drop view if exists public.public_contributions;

-- 1. Private schema for helpers that must never be reachable over the API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

-- 2. Profiles

update public.profiles set avatar_url = null
where avatar_url is not null and avatar_url !~ '^https://lh[0-9]\.googleusercontent\.com/';

alter table public.profiles
  add column if not exists blocked_at timestamptz,
  add column if not exists email_opt_out boolean not null default false;

update public.profiles set blocked_at = now(), role = 'member' where role = 'blocked';

drop trigger if exists on_profile_role_change on public.profiles;
drop function if exists public.protect_profile_role();

alter table public.profiles drop constraint profiles_role_check,
  add constraint profiles_role_check check (role in ('member', 'reviewer', 'admin'));
alter table public.profiles add constraint profiles_avatar_host
  check (avatar_url is null or avatar_url ~ '^https://lh[0-9]\.googleusercontent\.com/') not valid;
alter table public.profiles validate constraint profiles_avatar_host;

-- Members may change only their display name and email preference. Role, block, name, avatar and
-- deletion are written by the API with the service role.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, email_opt_out) on public.profiles to authenticated;

-- Sign-up and sign-in triggers: keep name and picture current; never fail the auth write.
-- (These stay in public so the auth triggers resolve them; execute is revoked from API roles.)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  pic text := coalesce(meta->>'avatar_url', meta->>'picture');
begin
  if pic !~ '^https://lh[0-9]\.googleusercontent\.com/' then pic := null; end if;
  insert into public.profiles (id, display_name, first_name, avatar_url)
  values (
    new.id,
    coalesce(meta->>'display_name', meta->>'full_name', meta->>'name'),
    nullif(split_part(coalesce(meta->>'full_name', meta->>'name', meta->>'display_name', ''), ' ', 1), ''),
    pic
  );
  return new;
exception when others then
  raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
  return new;
end;
$$;

create or replace function public.reactivate_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb;
  pic text;
begin
  select coalesce(u.raw_user_meta_data, '{}'::jsonb) into meta from auth.users u where u.id = new.user_id;
  pic := coalesce(meta->>'avatar_url', meta->>'picture');
  if pic !~ '^https://lh[0-9]\.googleusercontent\.com/' then pic := null; end if;
  update public.profiles p
  set deleted_at = null,
      avatar_url = coalesce(pic, p.avatar_url),
      first_name = coalesce(p.first_name, nullif(split_part(coalesce(meta->>'full_name', meta->>'name', ''), ' ', 1), ''))
  where p.id = new.user_id;
  return new;
exception when others then
  raise warning 'Failed to refresh profile for user %: %', new.user_id, sqlerrm;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.reactivate_profile() from public, anon, authenticated;

-- Last working admin can't be demoted, blocked, deleted or removed.
create or replace function private.guard_last_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(4242);
  if not exists (select 1 from public.profiles
                 where role = 'admin' and deleted_at is null and blocked_at is null) then
    raise exception 'At least one working admin is required';
  end if;
  return null;
end;
$$;

create trigger guard_last_admin
  after update or delete on public.profiles
  for each row when (old.role = 'admin')
  execute function private.guard_last_admin();

-- 3. Role helpers used by RLS policies (callable by authenticated; they only answer about the caller).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin' and deleted_at is null and blocked_at is null);
$$;

create or replace function public.is_reviewer_for(target_scope text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.profiles p join public.profile_review_scopes s on s.user_id = p.id
    where p.id = auth.uid() and p.role = 'reviewer' and p.deleted_at is null and p.blocked_at is null
      and (s.scope = target_scope or s.scope = 'all'));
$$;

-- 4. Contributions

alter table public.contributions
  drop column area,
  drop column publish_status,
  drop column published_in,
  drop column published_at,
  drop column publish_error,
  alter column user_id drop not null,
  alter column credit_opt_in set default false,
  add column region text check (region in ('kwale_north', 'kwale_south', 'kinondo_diani', 'tanga', 'diaspora', 'other')),
  add column village text check (char_length(village) <= 120),
  add column recorded_for jsonb,
  add column base jsonb,
  add column held boolean not null default false,
  add column hidden_at timestamptz,
  add column outcome text check (outcome in ('replace', 'variant')),
  add column second_reviewer_id uuid references public.profiles(id) on delete set null,
  add column second_reviewed_at timestamptz,
  add column claimed_by uuid references public.profiles(id) on delete set null,
  add column claimed_until timestamptz,
  add column reply text check (char_length(reply) <= 1000),
  add column duplicate_of uuid references public.contributions(id) on delete set null,
  add column live_status text check (live_status in ('awaiting_second', 'live', 'paused', 'conflict', 'reverting')),
  add column fold_status text check (fold_status in ('folding', 'in_preview', 'folded', 'failed')),
  add column fold_nonce uuid,
  add column fold_prev text,
  add column fold_claimed_at timestamptz,
  add column fold_pr int,
  add column folded_sha text,
  add column folded_at timestamptz,
  add column fold_error text,
  add column revert_requested_at timestamptz,
  add column raw_agree_count int not null default 0,
  add column is_test boolean not null default false;

alter table public.contributions
  drop constraint contributions_user_id_fkey,
  add constraint contributions_user_id_fkey foreign key (user_id) references public.profiles(id) on delete set null,
  drop constraint contributions_reviewer_id_fkey,
  add constraint contributions_reviewer_id_fkey foreign key (reviewer_id) references public.profiles(id) on delete set null,
  drop constraint contributions_status_check,
  add constraint contributions_status_check
    check (status in ('pending', 'needs_info', 'accepted', 'declined', 'duplicate', 'withdrawn', 'reverted'));

create index idx_contributions_fold on public.contributions (fold_status) where fold_status is not null;
create index idx_contributions_live on public.contributions (target_type, target_id) where status = 'accepted';

-- 5. Agreements

alter table public.contribution_agreements
  add column region text,
  add column confidence text,
  add column counted boolean not null default true;
create index idx_agreements_user on public.contribution_agreements (user_id, created_at);

create or replace function public.sync_agree_count()
returns trigger language plpgsql security definer set search_path = '' as $$
declare cid uuid := coalesce(new.contribution_id, old.contribution_id);
begin
  update public.contributions
  set agree_count = (select count(*) from public.contribution_agreements a where a.contribution_id = cid and a.counted),
      raw_agree_count = (select count(*) from public.contribution_agreements a where a.contribution_id = cid)
  where id = cid;
  return null;
end;
$$;
revoke execute on function public.sync_agree_count() from public, anon, authenticated;

drop trigger if exists on_agreement_change on public.contribution_agreements;
create trigger on_agreement_change
  after insert or delete or update of counted on public.contribution_agreements
  for each row execute function public.sync_agree_count();

-- 6. New tables

create table public.contribution_reports (
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('offensive', 'spam', 'personal_info', 'other')),
  created_at timestamptz not null default now(),
  primary key (contribution_id, user_id)
);
create index idx_reports_user on public.contribution_reports (user_id, created_at);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
-- Publishing starts paused; it is switched on at the end of phase 1b's gate.
insert into public.app_settings (key, value) values ('publishing_paused', 'true'), ('fold_requested_at', 'null');

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('accepted', 'needs_info', 'declined', 'reverted', 'second_review', 'report_hidden', 'fold_failed')),
  contribution_id uuid references public.contributions(id) on delete cascade,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_unread on public.notifications (user_id) where read_at is null;

create table private.fold_tokens (
  token_hash text primary key,
  created_at timestamptz not null default now()
);

-- 7. Append-only audit log. Its references become plain ids so deletes elsewhere never update it.

alter table public.contribution_events
  drop constraint contribution_events_actor_id_fkey,
  drop constraint contribution_events_contribution_id_fkey,
  drop constraint contribution_events_subject_user_id_fkey,
  add column is_test boolean not null default false;

-- SECURITY INVOKER on purpose: current_user is 'postgres' only inside the postgres-owned
-- maintenance functions (erasure, retention, test cleanup).
create or replace function private.events_append_only()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user <> 'postgres' then
    raise exception 'contribution_events is append-only';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger events_append_only
  before update or delete on public.contribution_events
  for each row execute function private.events_append_only();

revoke update, delete, truncate on public.contribution_events from anon, authenticated, service_role;

-- 8. Helpers for the public view

create or replace function private.mask_pii(t text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    t,
    '[‪-‮⁦-⁩]', '', 'g'),
    '(https?://|www\.)\S+', '[…]', 'gi'),
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[…]', 'g'),
    '(^|\s)@[A-Za-z0-9_.]{2,}', '\1[…]', 'g'),
    '\+?\d[\d\s().-]{7,}\d', '[…]', 'g');
$$;

-- Only the fields a type may show publicly, each masked.
create or replace function private.public_payload(ctype text, payload jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  allowed text[];
  k text;
  v jsonb;
  out jsonb := '{}'::jsonb;
begin
  allowed := case ctype
    when 'plant_name' then array['name', 'choice', 'other_names']
    when 'plant_info' then array['section', 'lang', 'mode', 'text']
    when 'plant_addition' then array['digo', 'swahili', 'english', 'description', 'uses']
    when 'word_addition' then array['headword', 'pos', 'meaning_en', 'meaning_sw', 'definition_dg', 'example_dg', 'example_en', 'example_sw']
    when 'definition_update' then array['sense_id', 'lang', 'text', 'mode']
    when 'example_sentence' then array['sense_id', 'dg', 'en', 'sw']
    when 'spelling_variant' then array['form', 'kind']
    when 'proverb_addition' then array['digo', 'literal_en', 'meaning_en', 'meaning_sw', 'meaning_dg', 'usage']
    when 'proverb_variant' then array['form']
    when 'proverb_meaning' then array['lang', 'text', 'kind']
    when 'proverb_context' then array['text']
    when 'translation_fix' then array['lang', 'proposed']
    else array[]::text[]
  end;
  foreach k in array allowed loop
    v := payload->k;
    if v is null then continue; end if;
    if jsonb_typeof(v) = 'string' then
      v := to_jsonb(private.mask_pii(v #>> '{}'));
    elsif jsonb_typeof(v) = 'array' then
      select coalesce(jsonb_agg(case when jsonb_typeof(e) = 'string' then to_jsonb(private.mask_pii(e #>> '{}')) else e end), '[]'::jsonb)
        into v from jsonb_array_elements(v) e;
    end if;
    out := out || jsonb_build_object(k, v);
  end loop;
  return out;
end;
$$;

grant usage on schema private to anon, authenticated;
-- (execute on these two pure helpers is granted in section 13; nothing else in private is callable)

-- 9. Views. Views are created by postgres, so revoke the default write grants explicitly:
-- a single-table definer view would otherwise be auto-updatable past RLS.

create view public.public_contributions with (security_invoker = false) as
select
  c.id, c.type, c.scope, c.target_type, c.target_id, c.target_path, c.target_label,
  c.region, c.confidence, c.status, c.agree_count, c.created_at,
  private.public_payload(c.type, c.payload) as public_payload
from public.contributions c
left join public.profiles p on p.id = c.user_id
where c.status in ('pending', 'needs_info')
  and not c.held and c.hidden_at is null
  and (not c.is_test or c.target_id = '__test__')  -- test rows only on the fixture target no page reads
  and c.scope <> 'feedback' and c.type <> 'entry_flag'
  and (p.id is null or (p.blocked_at is null and p.deleted_at is null));

revoke all on public.public_contributions from anon, authenticated;
grant select on public.public_contributions to anon, authenticated;

-- A member's own rows, without reviewer identities.
create view public.my_contributions with (security_invoker = false) as
select
  id, type, scope, target_type, target_id, target_path, target_label, payload, note, region, village,
  confidence, credit_opt_in, recorded_for, locale, page_path, status, review_note, reply, outcome,
  live_status, fold_status, folded_at, agree_count, created_at, updated_at, reviewed_at
from public.contributions
where user_id = auth.uid();

revoke all on public.my_contributions from anon, authenticated;
grant select on public.my_contributions to authenticated;

-- Credit for accepted contributions: names only when the contributor chose credit and the account is live.
create view public.contribution_credits with (security_invoker = false) as
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

-- 10. Row level security: clients only read. No insert, update or delete policies anywhere.

drop policy if exists "Members and reviewers read contributions" on public.contributions;
create policy "Reviewers read contributions in scope" on public.contributions for select
  using (public.is_reviewer_for(scope));

alter table public.contribution_reports enable row level security;
create policy "Users read own reports" on public.contribution_reports for select using (auth.uid() = user_id);

alter table public.notifications enable row level security;
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = user_id);

alter table public.app_settings enable row level security;
create policy "Anyone reads settings" on public.app_settings for select using (true);
-- Readers see the setting, not which admin changed it.
revoke select on public.app_settings from anon, authenticated;
grant select (key, value) on public.app_settings to anon, authenticated;

alter table private.fold_tokens enable row level security;

revoke insert, update, delete, truncate on
  public.contributions, public.contribution_agreements, public.contribution_reports, public.notifications,
  public.app_settings, public.reviewer_applications, public.profile_review_scopes, public.contribution_events
  from anon, authenticated;

-- 11. Write functions for the API (service role only).

create or replace function private.log_event(actor uuid, act text, cid uuid, subject uuid, extra jsonb, test boolean)
returns void language sql security definer set search_path = '' as $$
  insert into public.contribution_events (actor_id, action, contribution_id, subject_user_id, details, is_test)
  select actor, act, cid, subject,
         coalesce(extra, '{}'::jsonb) || jsonb_build_object('actor_first_name', p.first_name, 'actor_role', p.role),
         coalesce(test, false)
  from (select 1) one left join public.profiles p on p.id = actor;
$$;

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

-- A suggestion is open to agreement and reports only while it is on the public panel.
create or replace function private.is_public(c public.contributions)
returns boolean language sql stable set search_path = '' as $$
  select c.status in ('pending', 'needs_info') and not c.held and c.hidden_at is null
     and c.scope <> 'feedback' and c.type <> 'entry_flag'
     and (not c.is_test or c.target_id = '__test__')
     and not exists (select 1 from public.profiles p
                     where p.id = c.user_id and (p.blocked_at is not null or p.deleted_at is not null));
$$;

create or replace function public.agree_contribution(p_uid uuid, p_cid uuid, p_region text, p_confidence text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  prof record;
  c public.contributions;
  account_created timestamptz;
  n int;
begin
  select * into prof from public.profiles where id = p_uid;
  if prof.id is null or prof.deleted_at is not null then return jsonb_build_object('error', 'unauthorized'); end if;
  if prof.blocked_at is not null then return jsonb_build_object('error', 'blocked'); end if;

  perform pg_advisory_xact_lock(hashtext('contrib:' || p_uid::text));
  select * into c from public.contributions where id = p_cid;
  if c.id is null or not private.is_public(c) then return jsonb_build_object('error', 'not_found'); end if;
  if c.user_id = p_uid then return jsonb_build_object('error', 'own'); end if;

  select u.created_at into account_created from auth.users u where u.id = p_uid;
  select count(*) into n from public.contribution_agreements where user_id = p_uid and created_at > now() - interval '1 day';
  if n >= (case when account_created > now() - interval '24 hours' then 10 else 30 end) then
    return jsonb_build_object('error', 'limit_agree');
  end if;

  insert into public.contribution_agreements (contribution_id, user_id, region, confidence, counted)
  values (p_cid, p_uid, p_region, p_confidence, account_created <= now() - interval '7 days')
  on conflict do nothing;
  perform private.log_event(p_uid, 'agree', p_cid, null, null, c.is_test);

  select agree_count into n from public.contributions where id = p_cid;
  return jsonb_build_object('agree_count', n);
end;
$$;

create or replace function public.unagree_contribution(p_uid uuid, p_cid uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  delete from public.contribution_agreements where contribution_id = p_cid and user_id = p_uid;
  select agree_count into n from public.contributions where id = p_cid;
  return jsonb_build_object('agree_count', coalesce(n, 0));
end;
$$;

create or replace function public.report_contribution(p_uid uuid, p_cid uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  prof record;
  c public.contributions;
  n int;
begin
  select * into prof from public.profiles where id = p_uid;
  if prof.id is null or prof.deleted_at is not null then return jsonb_build_object('error', 'unauthorized'); end if;
  if prof.blocked_at is not null then return jsonb_build_object('error', 'blocked'); end if;

  perform pg_advisory_xact_lock(hashtext('contrib:' || p_uid::text));
  select * into c from public.contributions where id = p_cid for update;
  if c.id is null or not private.is_public(c) then return jsonb_build_object('error', 'not_found'); end if;

  select count(*) into n from public.contribution_reports where user_id = p_uid and created_at > now() - interval '1 day';
  if n >= 20 then return jsonb_build_object('error', 'limit_report'); end if;

  insert into public.contribution_reports (contribution_id, user_id, reason) values (p_cid, p_uid, p_reason)
  on conflict do nothing;
  perform private.log_event(p_uid, 'report', p_cid, null, jsonb_build_object('reason', p_reason), c.is_test);

  select count(*) into n from public.contribution_reports where contribution_id = p_cid;
  if n >= 3 then
    update public.contributions set hidden_at = now() where id = p_cid and hidden_at is null;
    if found then
      insert into public.notifications (user_id, kind, contribution_id)
      select id, 'report_hidden', p_cid from public.profiles where role = 'admin' and deleted_at is null and blocked_at is null;
      perform private.log_event(null, 'auto_hidden', p_cid, null, null, c.is_test);
    end if;
  end if;
  return jsonb_build_object('reported', true, 'hidden', n >= 3);
end;
$$;

-- Every review step is one conditional update; a lost race returns {error:'conflict'}.
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
    select count(*) into n from public.contribution_events
    where actor_id = p_uid and action in ('accept', 'accept_variant') and created_at > now() - interval '1 hour';
    if n >= 60 then return jsonb_build_object('error', 'rate_cap'); end if;
    live := case when coalesce((p_args->>'needs_second')::boolean, false) then 'awaiting_second'
                 when paused and not c.is_test then 'paused' else 'live' end;
    update public.contributions
    set status = 'accepted', reviewer_id = p_uid, reviewed_at = now(),
        final_payload = coalesce(p_args->'final_payload', payload), review_note = p_args->>'note',
        outcome = case when p_action = 'accept_variant' then 'variant' else 'replace' end,
        live_status = live, claimed_by = null, claimed_until = null
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

-- Turning publishing back on releases everything accepted while it was paused.
create or replace function public.set_publishing_paused(p_uid uuid, p_paused boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not exists (select 1 from public.profiles where id = p_uid and role = 'admin' and deleted_at is null and blocked_at is null) then
    return jsonb_build_object('error', 'forbidden');
  end if;
  update public.app_settings set value = to_jsonb(p_paused), updated_by = p_uid, updated_at = now() where key = 'publishing_paused';
  n := 0;
  if not p_paused then
    update public.contributions set live_status = 'live' where status = 'accepted' and live_status = 'paused';
    get diagnostics n = row_count;
  end if;
  perform private.log_event(p_uid, case when p_paused then 'pause_publishing' else 'resume_publishing' end, null, null,
                            jsonb_build_object('released', n), false);
  return jsonb_build_object('paused', p_paused, 'released', n);
end;
$$;

-- Erasure on request: keeps accepted content, removes every link to the person.
create or replace function public.erase_contributor(p_uid uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  update public.contributions set user_id = null, recorded_for = null, village = null where user_id = p_uid;
  update public.contributions set reviewer_id = null where reviewer_id = p_uid;
  update public.contributions set second_reviewer_id = null where second_reviewer_id = p_uid;
  update public.contributions set claimed_by = null, claimed_until = null where claimed_by = p_uid;
  update public.profiles set display_name = null, first_name = null, avatar_url = null where id = p_uid;
  delete from public.contribution_agreements where user_id = p_uid;
  delete from public.contribution_reports where user_id = p_uid;
  delete from public.notifications where user_id = p_uid;
  delete from public.reviewer_applications where user_id = p_uid;
  delete from public.profile_review_scopes where user_id = p_uid;
  update public.contribution_events set actor_id = null, details = details - 'actor_first_name' - 'actor_role'
    where actor_id = p_uid;
  update public.contribution_events set subject_user_id = null where subject_user_id = p_uid;
  insert into public.contribution_events (action, details) values ('erased', '{}'::jsonb);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.retention_purge()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a int; b int;
begin
  delete from public.contributions
  where status in ('declined', 'withdrawn') and updated_at < now() - interval '12 months';
  get diagnostics a = row_count;
  delete from public.contribution_events where created_at < now() - interval '24 months';
  get diagnostics b = row_count;
  update public.contributions set claimed_by = null, claimed_until = null where claimed_until < now();
  return jsonb_build_object('contributions', a, 'events', b);
end;
$$;

create or replace function public.cleanup_test_data()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a int; b int;
begin
  delete from public.contributions where is_test;
  get diagnostics a = row_count;
  delete from public.contribution_events where is_test;
  get diagnostics b = row_count;
  return jsonb_build_object('contributions', a, 'events', b);
end;
$$;

-- 12. Fold-in functions, guarded by a token. A leaked token can only claim rows and move its own
-- claims through the legal states; it can't read people or change content.

create or replace function private.fold_token_ok(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.fold_tokens
                 where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex'));
$$;

-- What fold-in may pick up: live changes not yet folded, and reverts of changes already in the files.
create or replace function private.fold_claimable(c public.contributions)
returns boolean language sql stable set search_path = '' as $$
  select c.status = 'accepted' and not c.is_test and (
    (c.live_status = 'live' and (c.fold_status is null
       or (c.fold_status = 'folding' and c.fold_claimed_at < now() - interval '2 hours')))
    or (c.live_status = 'reverting' and (c.fold_status in ('folded', 'failed')
       or (c.fold_status = 'in_preview' and c.revert_requested_at > c.fold_claimed_at)
       or (c.fold_status = 'folding' and c.fold_claimed_at < now() - interval '2 hours'))));
$$;

create or replace function public.fold_requested()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> '{}')::timestamptz from public.app_settings where key = 'fold_requested_at')
                  > now() - interval '1 day', false)
     and exists (select 1 from public.contributions c where private.fold_claimable(c));
$$;

create or replace function public.fold_claim(p_token text, p_mode text default 'claim')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  nonce uuid := gen_random_uuid();
  rows jsonb;
begin
  if not private.fold_token_ok(p_token) then raise exception 'invalid token'; end if;

  if p_mode = 'in_preview' then
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'live_status', live_status, 'type', type,
                                                 'target_type', target_type, 'target_id', target_id)), '[]'::jsonb)
      into rows from public.contributions where fold_status = 'in_preview';
    return jsonb_build_object('rows', rows);
  end if;

  with claimable as (
    select c.id from public.contributions c
    where private.fold_claimable(c)
    order by c.reviewed_at
    for update skip locked
  ), claimed as (
    update public.contributions c
    set fold_prev = case when c.fold_status = 'folding' then c.fold_prev else c.fold_status end,
        fold_status = 'folding', fold_claimed_at = now(), fold_nonce = nonce, fold_error = null
    from claimable where c.id = claimable.id
    returning c.id, c.type, c.target_type, c.target_id, c.target_path, c.final_payload, c.outcome,
              c.region, c.base, c.live_status, c.confidence, c.reviewed_at,
              (c.final_payload is distinct from c.payload) as edited
  )
  select coalesce(jsonb_agg(to_jsonb(claimed) order by reviewed_at), '[]'::jsonb) into rows from claimed;

  insert into public.contribution_events (action, details)
  values ('fold_claim', jsonb_build_object('nonce', nonce, 'count', jsonb_array_length(rows)));
  return jsonb_build_object('nonce', nonce, 'rows', rows);
end;
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
    where id = any(p_ids) and fold_status = 'in_preview' and live_status = 'reverting';
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

-- 13. Execute grants: API functions for the service role only; fold-in functions for anon (token-guarded).

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.mask_pii(text), private.public_payload(text, jsonb) to anon, authenticated;

revoke execute on function
  public.submit_contribution(uuid, jsonb), public.agree_contribution(uuid, uuid, text, text),
  public.unagree_contribution(uuid, uuid), public.report_contribution(uuid, uuid, text),
  public.review_transition(uuid, uuid, text, jsonb), public.set_publishing_paused(uuid, boolean),
  public.erase_contributor(uuid), public.retention_purge(), public.cleanup_test_data()
  from public, anon, authenticated;
grant execute on function
  public.submit_contribution(uuid, jsonb), public.agree_contribution(uuid, uuid, text, text),
  public.unagree_contribution(uuid, uuid), public.report_contribution(uuid, uuid, text),
  public.review_transition(uuid, uuid, text, jsonb), public.set_publishing_paused(uuid, boolean),
  public.erase_contributor(uuid), public.retention_purge(), public.cleanup_test_data()
  to service_role;

revoke execute on function public.fold_requested(), public.fold_claim(text, text),
  public.fold_mark(text, uuid, uuid[], text, int, text, text) from public;
grant execute on function public.fold_requested(), public.fold_claim(text, text),
  public.fold_mark(text, uuid, uuid[], text, int, text, text) to anon, service_role;

