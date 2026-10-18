do $$ begin assert exists (select 1 from pg_trigger where tgname = 'settle_second_review_notices'), 'trigger missing'; end $$;
