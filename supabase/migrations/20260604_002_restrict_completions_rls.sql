-- Restrict challenge_completions SELECT to hide answers column from public access.
-- The answers column contains selected_answer_index which can be used to deduce
-- correct answers when combined with question data.
--
-- Strategy: replace the open SELECT policy with one that only allows:
-- 1. Public read of non-sensitive columns (via API routes that select specific columns)
-- 2. Full row access for the completion owner (user_id match)
-- 3. Full row access for the challenge creator (challenger_id match)
-- Service role bypasses RLS entirely, so API routes that need answers still work.

drop policy if exists "Anyone can read completions" on public.challenge_completions;

-- Public can see leaderboard data (score, display_name, etc.) but PostgREST
-- will still return all columns. To truly hide answers, we use security definer
-- functions in the API. For now, restrict SELECT to participants only.

create policy "Participants can read completions"
  on public.challenge_completions for select using (
    auth.uid() = user_id
    or auth.uid() = challenger_id
    or auth.uid() in (
      select challenger_id from public.challenges where id = challenge_id
    )
  );

-- Allow anonymous read for leaderboard display (without answers) via service role.
-- The completions endpoint already uses the regular supabase client with specific
-- column selection, but since we're restricting RLS, that endpoint needs to switch
-- to service role too. The tradeoff is acceptable — leaderboard data is low-sensitivity.
