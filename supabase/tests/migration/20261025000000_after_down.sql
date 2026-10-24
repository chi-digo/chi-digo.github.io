do $$ begin
  assert to_regclass('public.profile_review_languages') is null, 'rollback kept the table';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'profile_review_languages') = 0, 'rollback kept the language check';
  assert strpos(pg_get_functiondef('public.fold_claim(text, text)'::regprocedure), '''reason''') = 0, 'rollback kept the new fold_claim';
  assert to_regprocedure('public.notify_overdue_translations()') is null, 'rollback kept the overdue notice';
end $$;
