do $$ begin assert not exists (select 1 from pg_proc where proname = 'admin_self_confirm'), 'not removed'; end $$;
