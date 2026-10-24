do $$ begin
  assert to_regprocedure('private.reads_language(uuid, text, public.contributions)') is not null, 'reads_language missing';
  assert strpos(pg_get_functiondef('private.has_other_second_reviewer(public.contributions)'::regprocedure), 'reads_language') > 0, 'self-confirm ignores languages';
  assert strpos(pg_get_functiondef('private.notify_second_review()'::regprocedure), 'reads_language') > 0, 'second-review notice ignores languages';
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), '''field''') > 0, 'translation fields not locked';
  assert to_regclass('public.notifications_translation_overdue_once') is not null, 'overdue unique index missing';
end $$;
