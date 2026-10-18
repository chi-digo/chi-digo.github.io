do $$ begin assert strpos(pg_get_functiondef('private.fold_claimable(public.contributions)'::regprocedure), 'general_feedback') = 0, 'not rolled back'; end $$;
