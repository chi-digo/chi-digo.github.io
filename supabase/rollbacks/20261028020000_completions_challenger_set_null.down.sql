alter table public.challenge_completions drop constraint challenge_completions_challenger_id_fkey;
alter table public.challenge_completions add constraint challenge_completions_challenger_id_fkey
  foreign key (challenger_id) references public.profiles(id);
