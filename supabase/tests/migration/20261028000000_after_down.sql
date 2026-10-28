do $$ begin
  assert strpos(pg_get_functiondef('public.can_self_confirm(uuid, uuid)'::regprocedure), '''ui''') = 0, 'rollback kept the ui rule';
end $$;
