do $$ begin
  assert strpos(pg_get_functiondef('public.fold_mark(text, uuid, uuid[], text, int, text, text)'::regprocedure), 'fold_claimed_at >= revert_requested_at') > 0, 'revert guard missing';
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), 'target_type = ''plant''') > 0, 'plant scope missing';
  assert strpos(pg_get_functiondef('public.fold_requested()'::regprocedure), 'fold_claim') > 0, 'request reset missing';
end $$;
