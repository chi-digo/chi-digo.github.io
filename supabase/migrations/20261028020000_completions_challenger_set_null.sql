-- ISSUES ACC-2: deleting a user who sent a challenge that someone completed failed on this key.
-- Keep the completion and forget the challenger, as challenges.challenger_id already does; the
-- challenge page then shows the fallback name.
alter table public.challenge_completions drop constraint challenge_completions_challenger_id_fkey;
alter table public.challenge_completions add constraint challenge_completions_challenger_id_fkey
  foreign key (challenger_id) references public.profiles(id) on delete set null;
