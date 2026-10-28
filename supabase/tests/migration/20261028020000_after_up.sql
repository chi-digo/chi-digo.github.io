do $$ begin
  assert (select confdeltype from pg_constraint where conname = 'challenge_completions_challenger_id_fkey') = 'n', 'completions challenger_id not set null';
end $$;
