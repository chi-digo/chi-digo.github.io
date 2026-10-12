-- Spec 34: community contributions, reviewer roles and the review audit log.

-- 1. Roles and public identity on profiles

alter table public.profiles
  add column if not exists role text not null default 'member'
    check (role in ('member', 'reviewer', 'admin', 'blocked')),
  add column if not exists first_name text,  -- first word of the name; shown in contributor credits
  add column if not exists avatar_url text;  -- Google profile picture

-- Fill first name and picture from Google sign-in metadata for existing users.
update public.profiles p
set first_name = coalesce(p.first_name, split_part(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', p.display_name, ''), ' ', 1)),
    avatar_url = coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', p.avatar_url)
from auth.users u
where u.id = p.id;

update public.profiles set first_name = null where first_name = '';

-- New users: copy name and picture at sign-up as well as the display name.
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

-- Keep the picture fresh on each sign-in (Google pictures change).
create or replace function public.reactivate_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles p
  set deleted_at = null,
      avatar_url = coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', p.avatar_url),
      first_name = coalesce(p.first_name, nullif(split_part(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1), ''))
  from auth.users u
  where p.id = new.user_id and u.id = new.user_id;
  return new;
end;
$$;

-- The product owner is the first admin.
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'athmangude@gmail.com');

-- Members can update their own profile, but never their role: role changes come from the
-- admin API (service role) or SQL. Not security definer, so current_user is the caller's role.
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if new.role is distinct from old.role and current_user in ('authenticated', 'anon') then
    raise exception 'role can only be changed by an admin';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profile_role_change on public.profiles;
create trigger on_profile_role_change
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 2. Reviewer scopes

create table public.profile_review_scopes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null check (scope in ('dictionary', 'proverbs', 'plants', 'translations', 'feedback', 'all')),
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, scope)
);

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

-- 3. Contributions

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'word_addition', 'definition_update', 'example_sentence', 'spelling_variant', 'entry_flag',
    'proverb_addition', 'proverb_variant', 'proverb_meaning', 'proverb_context',
    'plant_name', 'plant_info', 'plant_addition', 'translation_fix', 'general_feedback')),
  scope text not null check (scope in ('dictionary', 'proverbs', 'plants', 'translations', 'feedback')),
  target_type text check (target_type in ('word', 'proverb', 'plant', 'article', 'glossary', 'ui', 'page')),
  target_id text,
  target_path text,
  target_label text,
  payload jsonb not null,
  note text check (char_length(note) <= 2000),
  area text check (char_length(area) <= 120),
  confidence text check (confidence in ('native', 'heard', 'unsure')),
  credit_opt_in boolean not null default true,
  locale text not null check (locale in ('en', 'sw', 'dg')),
  page_path text,
  data_version text,
  status text not null default 'pending'
    check (status in ('pending', 'needs_info', 'accepted', 'declined', 'duplicate', 'withdrawn')),
  reviewer_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 2000),
  final_payload jsonb,
  publish_status text check (publish_status in ('queued', 'published', 'failed')),
  published_in text,
  published_at timestamptz,
  publish_error text,
  agree_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contributions_queue on public.contributions (status, scope, created_at);
create index idx_contributions_target on public.contributions (target_type, target_id);
create index idx_contributions_user on public.contributions (user_id, created_at desc);
create index idx_contributions_publish on public.contributions (publish_status) where publish_status is not null;

create trigger on_contribution_updated
  before update on public.contributions
  for each row execute function public.handle_updated_at();

create table public.contribution_agreements (
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contribution_id, user_id)
);

-- Keep agree_count in step with the agreements table.
create or replace function public.sync_agree_count()
returns trigger as $$
begin
  update public.contributions
  set agree_count = (select count(*) from public.contribution_agreements where contribution_id = coalesce(new.contribution_id, old.contribution_id))
  where id = coalesce(new.contribution_id, old.contribution_id);
  return null;
end;
$$ language plpgsql security definer;

create trigger on_agreement_change
  after insert or delete on public.contribution_agreements
  for each row execute function public.sync_agree_count();

create table public.reviewer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scopes text[] not null,
  message text check (char_length(message) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);

create table public.contribution_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  contribution_id uuid references public.contributions(id) on delete set null,
  subject_user_id uuid references public.profiles(id) on delete set null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index idx_events_created on public.contribution_events (created_at desc);

-- 4. Public view of suggestions under review: never exposes who submitted unless they opted in.

create or replace view public.public_contributions
with (security_invoker = false) as
select
  c.id, c.type, c.scope, c.target_type, c.target_id, c.target_path, c.target_label,
  c.payload, c.area, c.confidence, c.locale, c.status, c.agree_count, c.created_at,
  case when c.credit_opt_in then p.first_name end as contributor_first_name,
  case when c.credit_opt_in then p.avatar_url end as contributor_avatar_url
from public.contributions c
join public.profiles p on p.id = c.user_id
where c.status in ('pending', 'needs_info') and c.scope <> 'feedback'  -- general feedback may be personal
  and p.role <> 'blocked' and p.deleted_at is null;

grant select on public.public_contributions to anon, authenticated;

-- 5. Row level security
-- Reads go through RLS. Every write (submit, agree, withdraw, review, roles, applications) goes
-- through the API with the service role, so validation, rate limits and the audit log can't be skipped.

alter table public.profile_review_scopes enable row level security;
create policy "Users read own scopes" on public.profile_review_scopes for select using (auth.uid() = user_id or public.is_admin());

alter table public.contributions enable row level security;
create policy "Members and reviewers read contributions" on public.contributions for select
  using (auth.uid() = user_id or public.is_reviewer_for(scope));

alter table public.contribution_agreements enable row level security;
create policy "Users read own agreements" on public.contribution_agreements for select using (auth.uid() = user_id);

alter table public.reviewer_applications enable row level security;
create policy "Users read own applications" on public.reviewer_applications for select using (auth.uid() = user_id or public.is_admin());

alter table public.contribution_events enable row level security;
create policy "Admins read events" on public.contribution_events for select using (public.is_admin());
