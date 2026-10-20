do $$ begin
  assert strpos(pg_get_functiondef('public.fold_mark(text, uuid, uuid[], text, int, text, text, jsonb)'::regprocedure), 'p_target_ids') > 0, 'id write-back missing';
  assert to_regprocedure('public.fold_mark(text, uuid, uuid[], text, int, text, text)') is null, 'old fold_mark left behind';
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), '''word''') > 0, 'words not claimable';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'not_acceptable') > 0, 'flag accept guard missing';
  assert strpos(pg_get_functiondef('public.submit_contribution(uuid, jsonb)'::regprocedure), 'limit_words') > 0, 'word cap missing';
  assert strpos(pg_get_constraintdef((select oid from pg_constraint where conname = 'contributions_status_check')), 'resolved') > 0, 'resolved status missing';
  assert has_function_privilege('anon', 'public.fold_mark(text, uuid, uuid[], text, int, text, text, jsonb)', 'execute'), 'fold_mark not callable by the fold token';
  assert not has_function_privilege('anon', 'public.review_transition(uuid, uuid, text, jsonb)', 'execute'), 'review_transition exposed';
end $$;
