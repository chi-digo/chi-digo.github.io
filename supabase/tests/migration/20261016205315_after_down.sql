do $$ begin assert not exists (select 1 from pg_trigger where tgname = 'settle_second_review_notices'), 'not removed'; end $$;
