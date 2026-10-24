do $$ begin
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'proverb-ids') > 0, 'id reservation missing';
  assert strpos(pg_get_functiondef('public.submit_contribution(uuid, jsonb)'::regprocedure), 'limit_proverbs') > 0, 'proverb cap missing';
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), '''proverb''') > 0, 'proverbs not claimable';
  assert strpos(pg_get_functiondef('private.public_payload(text, jsonb)'::regprocedure), '''usage_lang''') > 0, 'public payload not updated';
  assert to_regclass('public.contributions_proverb_id_unique') is not null, 'unique index missing';
end $$;
