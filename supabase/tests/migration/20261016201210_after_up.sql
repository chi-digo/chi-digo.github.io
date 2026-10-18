do $$ begin assert exists (select 1 from pg_trigger where tgname = 'notify_second_review'), 'trigger missing'; end $$;
