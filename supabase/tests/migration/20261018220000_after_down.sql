do $$ begin
  assert strpos(pg_get_functiondef('public.fold_mark(text, uuid, uuid[], text, int, text, text)'::regprocedure), 'fold_claimed_at >= revert_requested_at') = 0, 'revert guard left behind';
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), 'general_feedback') > 0, 'previous claimable not restored';
end $$;
