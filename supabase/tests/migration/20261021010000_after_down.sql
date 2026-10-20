do $$ begin
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'locked_fields') = 0, 'field lock left behind';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'not_acceptable') > 0, 'previous review_transition not restored';
end $$;
