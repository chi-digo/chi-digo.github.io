do $$ begin
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'proverb-ids') = 0, 'id reservation left behind';
  assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), '''proverb''') = 0, 'proverbs still claimable';
  assert to_regclass('public.contributions_proverb_id_unique') is null, 'unique index left behind';
  assert to_regprocedure('private.close_suggestions_on(text, uuid)') is null, 'helper left behind';
end $$;
