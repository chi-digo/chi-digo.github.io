do $$ begin
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), '''article''') > 0, 'article not claimable';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), '''block''') > 0, 'block not locked';
end $$;
