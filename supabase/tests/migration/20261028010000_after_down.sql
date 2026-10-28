do $$ begin
  assert strpos(pg_get_functiondef('public.can_self_confirm(uuid, uuid)'::regprocedure), 'ui_self_confirm') = 0, 'rollback kept the switch';
end $$;
