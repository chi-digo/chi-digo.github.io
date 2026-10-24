do $$ begin
  assert to_regclass('public.profile_review_languages') is not null, 'review languages table missing';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'profile_review_languages') > 0, 'language check missing';
  assert strpos(pg_get_functiondef('public.fold_claim(text, text)'::regprocedure), '''reason''') > 0, 'fold_claim still sends reasons';
  assert to_regprocedure('public.notify_overdue_translations()') is not null, 'overdue notice missing';
end $$;
