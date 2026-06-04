-- Quiz Challenge feature: one-to-many challenge sharing
-- Spec: context/specs/quiz-challenge-technical-spec.md

-- 1. Tables

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  challenger_id uuid references public.profiles(id) on delete set null,
  round_id uuid not null references public.quiz_rounds(id) on delete cascade,
  score smallint not null,
  total smallint not null default 10,
  category_breakdown jsonb,
  difficulty_distribution jsonb,
  time_taken_ms integer,
  status text not null default 'active'
    check (status in ('active', 'expired')),
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

create table public.challenge_questions (
  challenge_id uuid primary key references public.challenges(id) on delete cascade,
  questions_public jsonb not null,
  questions_answers jsonb not null
);

create table public.challenge_completions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  challenger_id uuid references public.profiles(id),
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_id text,
  display_name text,
  avatar_url text,
  score smallint not null,
  total smallint not null default 10,
  time_taken_ms integer,
  answers jsonb not null,
  completed_at timestamptz default now(),
  unique(challenge_id, user_id),
  unique(challenge_id, anonymous_id)
);

-- 2. Indexes

create index idx_challenges_challenger on public.challenges(challenger_id, created_at desc);
create index idx_challenges_expires on public.challenges(expires_at) where status = 'active';
create index idx_completions_challenge on public.challenge_completions(challenge_id, score desc);
create index idx_completions_user on public.challenge_completions(user_id, completed_at desc);
create index idx_completions_challenger on public.challenge_completions(challenger_id);

-- 3. Row Level Security

alter table public.challenges enable row level security;
alter table public.challenge_questions enable row level security;
alter table public.challenge_completions enable row level security;

create policy "Anyone can read challenges"
  on public.challenges for select using (true);

create policy "Authenticated users can create challenges"
  on public.challenges for insert with check (auth.uid() = challenger_id);

-- challenge_questions: NO public SELECT policy.
-- Only accessible via service role in API routes to prevent answer leakage.

create policy "Anyone can read completions"
  on public.challenge_completions for select using (true);

create policy "Authenticated users can insert own completions"
  on public.challenge_completions for insert with check (auth.uid() = user_id);

-- 4. Expiry cron (requires pg_cron extension enabled in Supabase)

select cron.schedule(
  'expire-challenges',
  '0 3 * * *',
  $$update public.challenges set status = 'expired' where status = 'active' and expires_at < now()$$
);
