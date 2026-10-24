do $$ begin
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'substring(new_path from 3)') > 0, 'id not spent after accept';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'is_test = c.is_test') > 0, 'merge not limited to test or real rows';
end $$;
do $$ begin
  assert strpos(pg_get_functiondef('public.fold_claim(text, text)'::regprocedure), '''themes'' - ''mature''') > 0, 'fold_claim edited flag not updated';
end $$;
