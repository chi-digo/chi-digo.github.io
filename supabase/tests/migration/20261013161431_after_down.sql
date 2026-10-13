do $$ begin assert strpos(pg_get_viewdef('public.contribution_credits'::regclass), '''__test__''') = 0, 'fixture rule not removed'; end $$;
