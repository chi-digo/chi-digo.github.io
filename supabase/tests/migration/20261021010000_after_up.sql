do $$ begin
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'locked_fields') > 0, 'field lock missing';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'senses:') > 0, 'sense lock missing';
  assert strpos(pg_get_functiondef('public.fold_mark(text, uuid, uuid[], text, int, text, text, jsonb)'::regprocedure), 'coalesce(c.final_payload, c.payload)') > 0, 'reviewed headword not used';
end $$;
