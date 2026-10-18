do $$ begin assert strpos(pg_get_functiondef('private.notify_second_review()'::regprocedure), 'raw_app_meta_data') = 0, 'not rolled back'; end $$;
