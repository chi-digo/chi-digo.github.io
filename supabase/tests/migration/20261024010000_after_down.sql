do $$ begin
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'substring(new_path from 3)') = 0, 'rollback kept the new definition';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'proverb-ids') > 0, 'rollback lost the id reservation';
end $$;
do $$ begin
  assert strpos(pg_get_functiondef('public.fold_claim(text, text)'::regprocedure), '''themes'' - ''mature''') = 0, 'fold_claim rollback kept the new flag';
end $$;
