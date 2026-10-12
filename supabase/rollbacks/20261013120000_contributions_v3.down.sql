-- Rollback for 20261013120000_contributions_v3.sql: restores the v2 (20261012) shape.
-- Contribution rows keep their v2 columns; v3-only data (regions, reports, notifications, fold state) is dropped.

drop trigger if exists guard_last_admin on public.profiles;
drop trigger if exists events_append_only on public.contribution_events;
-- The v3 agreement trigger writes raw_agree_count; drop it before that column goes (recreated below).
drop trigger if exists on_agreement_change on public.contribution_agreements;

drop function if exists public.fold_mark(text, uuid, uuid[], text, int, text, text);
drop function if exists public.fold_claim(text, text);
drop function if exists public.fold_requested();
drop function if exists public.cleanup_test_data();
drop function if exists public.retention_purge();
drop function if exists public.erase_contributor(uuid);
drop function if exists public.set_publishing_paused(uuid, boolean);
drop function if exists public.review_transition(uuid, uuid, text, jsonb);
drop function if exists public.report_contribution(uuid, uuid, text);
drop function if exists public.unagree_contribution(uuid, uuid);
drop function if exists public.agree_contribution(uuid, uuid, text, text);
drop function if exists public.submit_contribution(uuid, jsonb);

drop view if exists public.contribution_credits;
drop view if exists public.my_contributions;
drop view if exists public.public_contributions;

drop table if exists public.contribution_reports;
drop table if exists public.notifications;
drop table if exists public.app_settings;
drop table if exists private.fold_tokens;
drop schema if exists private cascade;

-- Profiles
alter table public.profiles drop constraint if exists profiles_avatar_host;
alter table public.profiles drop constraint profiles_role_check,
  add constraint profiles_role_check check (role in ('member', 'reviewer', 'admin', 'blocked'));
update public.profiles set role = 'blocked' where blocked_at is not null and role <> 'admin';
alter table public.profiles drop column if exists blocked_at, drop column if exists email_opt_out;
grant update on public.profiles to authenticated;

create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role and current_user in ('authenticated', 'anon') then
    raise exception 'role can only be changed by an admin';
  end if;
  return new;
end;
$$ language plpgsql;
create trigger on_profile_role_change before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Contributions back to v2 columns
delete from public.contributions where status = 'reverted';
alter table public.contributions
  drop constraint contributions_status_check,
  add constraint contributions_status_check
    check (status in ('pending', 'needs_info', 'accepted', 'declined', 'duplicate', 'withdrawn')),
  drop column region, drop column village, drop column recorded_for, drop column base, drop column held,
  drop column hidden_at, drop column outcome, drop column second_reviewer_id, drop column second_reviewed_at,
  drop column claimed_by, drop column claimed_until, drop column reply, drop column duplicate_of,
  drop column live_status, drop column fold_status, drop column fold_nonce, drop column fold_prev,
  drop column fold_claimed_at, drop column fold_pr, drop column folded_sha, drop column folded_at,
  drop column fold_error, drop column revert_requested_at, drop column raw_agree_count, drop column is_test,
  add column area text check (char_length(area) <= 120),
  add column publish_status text check (publish_status in ('queued', 'published', 'failed')),
  add column published_in text,
  add column published_at timestamptz,
  add column publish_error text,
  alter column credit_opt_in set default true;
delete from public.contributions where user_id is null;
alter table public.contributions alter column user_id set not null,
  drop constraint contributions_user_id_fkey,
  add constraint contributions_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade,
  drop constraint contributions_reviewer_id_fkey,
  add constraint contributions_reviewer_id_fkey foreign key (reviewer_id) references public.profiles(id);
create index if not exists idx_contributions_publish on public.contributions (publish_status) where publish_status is not null;
drop index if exists idx_contributions_fold;
drop index if exists idx_contributions_live;

-- Agreements
drop trigger if exists on_agreement_change on public.contribution_agreements;
drop index if exists idx_agreements_user;
alter table public.contribution_agreements drop column region, drop column confidence, drop column counted;
create or replace function public.sync_agree_count()
returns trigger as $$
begin
  update public.contributions
  set agree_count = (select count(*) from public.contribution_agreements where contribution_id = coalesce(new.contribution_id, old.contribution_id))
  where id = coalesce(new.contribution_id, old.contribution_id);
  return null;
end;
$$ language plpgsql security definer;
create trigger on_agreement_change after insert or delete on public.contribution_agreements
  for each row execute function public.sync_agree_count();

-- Events
alter table public.contribution_events drop column is_test;
update public.contribution_events e set actor_id = null where actor_id is not null and not exists (select 1 from public.profiles p where p.id = e.actor_id);
update public.contribution_events e set subject_user_id = null where subject_user_id is not null and not exists (select 1 from public.profiles p where p.id = e.subject_user_id);
update public.contribution_events e set contribution_id = null where contribution_id is not null and not exists (select 1 from public.contributions c where c.id = e.contribution_id);
alter table public.contribution_events
  add constraint contribution_events_actor_id_fkey foreign key (actor_id) references public.profiles(id) on delete set null,
  add constraint contribution_events_contribution_id_fkey foreign key (contribution_id) references public.contributions(id) on delete set null,
  add constraint contribution_events_subject_user_id_fkey foreign key (subject_user_id) references public.profiles(id) on delete set null;
grant update, delete on public.contribution_events to service_role;

-- Role helpers and RLS as in v2
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and deleted_at is null);
$$;
create or replace function public.is_reviewer_for(target_scope text)
returns boolean language sql stable security definer as $$
  select public.is_admin() or exists (
    select 1 from public.profiles p join public.profile_review_scopes s on s.user_id = p.id
    where p.id = auth.uid() and p.role = 'reviewer' and p.deleted_at is null
      and (s.scope = target_scope or s.scope = 'all'));
$$;
drop policy if exists "Reviewers read contributions in scope" on public.contributions;
create policy "Members and reviewers read contributions" on public.contributions for select
  using (auth.uid() = user_id or public.is_reviewer_for(scope));

create or replace view public.public_contributions
with (security_invoker = false) as
select
  c.id, c.type, c.scope, c.target_type, c.target_id, c.target_path, c.target_label,
  c.payload, c.area, c.confidence, c.locale, c.status, c.agree_count, c.created_at,
  case when c.credit_opt_in then p.first_name end as contributor_first_name,
  case when c.credit_opt_in then p.avatar_url end as contributor_avatar_url
from public.contributions c
join public.profiles p on p.id = c.user_id
where c.status in ('pending', 'needs_info') and c.scope <> 'feedback'
  and p.role <> 'blocked' and p.deleted_at is null;
grant select on public.public_contributions to anon, authenticated;

-- Auth trigger functions as in v2
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, first_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    nullif(split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'display_name', ''), ' ', 1), ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
exception
  when others then
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;
