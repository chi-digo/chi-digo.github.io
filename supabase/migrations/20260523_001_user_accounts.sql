-- Spec 27: User accounts, favourites, quiz history
-- Run in Supabase SQL Editor

-- 1. Tables

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_type text not null check (entry_type in ('word', 'proverb')),
  entry_id text not null,
  entry_label text not null,
  entry_gloss text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_type, entry_id)
);

create table public.quiz_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  played_at timestamptz not null default now(),
  score smallint not null,
  total smallint not null default 10,
  time_taken_ms integer,
  difficulty_distribution jsonb,
  category_breakdown jsonb
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.quiz_rounds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_index smallint not null,
  question_id text not null,
  category text not null,
  difficulty text not null,
  question_text text not null,
  options jsonb not null,
  selected_option_id text not null,
  correct_option_id text not null,
  is_correct boolean not null,
  time_to_answer_ms integer,
  explanation text
);

-- 2. Indexes

create index idx_favourites_user on public.favourites(user_id, created_at desc);
create index idx_quiz_rounds_user on public.quiz_rounds(user_id, played_at desc);
create index idx_quiz_answers_round on public.quiz_answers(round_id, question_index);
create index idx_quiz_answers_user on public.quiz_answers(user_id);

-- 3. Row Level Security

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id and deleted_at is null);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id and deleted_at is null);

alter table public.favourites enable row level security;

create policy "Users can read own favourites"
  on public.favourites for select
  using (auth.uid() = user_id
    and user_id in (select id from public.profiles where deleted_at is null));

create policy "Users can insert own favourites"
  on public.favourites for insert
  with check (auth.uid() = user_id
    and user_id in (select id from public.profiles where deleted_at is null));

create policy "Users can delete own favourites"
  on public.favourites for delete
  using (auth.uid() = user_id);

alter table public.quiz_rounds enable row level security;

create policy "Users can read own rounds"
  on public.quiz_rounds for select using (auth.uid() = user_id);

create policy "Users can insert own rounds"
  on public.quiz_rounds for insert with check (auth.uid() = user_id);

alter table public.quiz_answers enable row level security;

create policy "Users can read own answers"
  on public.quiz_answers for select using (auth.uid() = user_id);

create policy "Users can insert own answers"
  on public.quiz_answers for insert with check (auth.uid() = user_id);

-- 4. Triggers

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
exception
  when others then
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();
