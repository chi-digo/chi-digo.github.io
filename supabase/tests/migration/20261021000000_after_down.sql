do $$ begin
  assert to_regprocedure('public.fold_mark(text, uuid, uuid[], text, int, text, text, jsonb)') is null, 'new fold_mark left behind';
  assert strpos(pg_get_functiondef('public.fold_mark(text, uuid, uuid[], text, int, text, text)'::regprocedure), 'fold_claimed_at >= revert_requested_at') > 0, 'previous fold_mark not restored';
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), '''word''') = 0, 'words still claimable';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'not_acceptable') = 0, 'flag guard left behind';
  assert strpos(pg_get_constraintdef((select oid from pg_constraint where conname = 'contributions_status_check')), 'resolved') = 0, 'resolved status left behind';
end $$;
