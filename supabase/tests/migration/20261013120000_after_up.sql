-- Shape checks after applying v3.
do $$
begin
  assert exists (select 1 from information_schema.columns where table_name = 'contributions' and column_name = 'live_status'), 'live_status missing';
  assert not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'contributions' and column_name = 'area'), 'area should be gone';
  assert exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'blocked_at'), 'blocked_at missing';
  assert exists (select 1 from pg_views where viewname = 'my_contributions'), 'my_contributions missing';
  assert (select value #>> '{}' from public.app_settings where key = 'publishing_paused') = 'true', 'publishing should start paused';
  assert not has_function_privilege('anon', 'public.submit_contribution(uuid, jsonb)', 'execute'), 'anon can execute submit';
  assert not has_function_privilege('authenticated', 'public.review_transition(uuid, uuid, text, jsonb)', 'execute'), 'authenticated can execute review';
  assert has_function_privilege('anon', 'public.fold_claim(text, text)', 'execute'), 'anon must reach fold_claim (token-guarded)';
  assert not has_table_privilege('authenticated', 'public.profiles', 'update'), 'table-wide profile update still granted';
  assert has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update'), 'display_name update missing';
  assert not has_column_privilege('authenticated', 'public.profiles', 'role', 'update'), 'role update granted';
  assert not has_table_privilege('authenticated', 'public.my_contributions', 'update'), 'my_contributions is writable';
  assert not has_table_privilege('service_role', 'public.contribution_events', 'update'), 'service role can update events';
  assert (select count(*) from public.profiles where role = 'admin') >= 1, 'admin lost';
end $$;
