do $$ begin
  assert exists (select 1 from pg_proc where proname = 'admin_self_confirm'), 'function missing';
  assert not has_function_privilege('authenticated', 'public.admin_self_confirm(uuid, uuid)', 'execute'), 'callable by clients';
end $$;
