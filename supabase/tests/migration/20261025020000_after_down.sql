do $$ begin
  assert to_regprocedure('private.reads_language(uuid, text, public.contributions)') is null, 'rollback kept reads_language';
  assert to_regclass('public.notifications_translation_overdue_once') is null, 'rollback kept the index';
  assert strpos(pg_get_functiondef('private.notify_second_review()'::regprocedure), 'reads_language') = 0, 'rollback kept the new notice';
end $$;
