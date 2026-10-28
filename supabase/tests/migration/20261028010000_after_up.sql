do $$ begin
  assert strpos(pg_get_functiondef('public.review_transition(uuid, uuid, text, jsonb)'::regprocedure), 'or c.target_type = ''ui'' then ''awaiting_second''') > 0, 'ui second voice not enforced';
  assert strpos(pg_get_functiondef('public.can_self_confirm(uuid, uuid)'::regprocedure), 'ui_self_confirm') > 0, 'owner switch missing';
  assert exists (select 1 from public.app_settings where key = 'ui_self_confirm'), 'setting missing';
end $$;
