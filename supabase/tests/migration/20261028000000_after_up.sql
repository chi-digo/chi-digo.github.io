do $$ begin
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), '''ui''') > 0, 'ui not claimable';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), '''key''') > 0, 'key not locked';
  assert strpos(pg_get_functiondef('public.can_self_confirm(uuid, uuid)'::regprocedure), '''ui''') > 0, 'ui self-confirm not refused';
end $$;
do $$ begin
  assert strpos(pg_get_functiondef('public.fold_claim(text, text)'::regprocedure), '''proposed''') > 0, 'confirm listing lacks the interface text';
end $$;
