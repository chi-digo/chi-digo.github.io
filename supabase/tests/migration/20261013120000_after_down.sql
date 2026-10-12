-- Shape checks after rolling back to v2.
do $$
begin
  assert exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'contributions' and column_name = 'area'), 'area not restored';
  assert not exists (select 1 from information_schema.columns where table_name = 'contributions' and column_name = 'live_status'), 'live_status not removed';
  assert not exists (select 1 from information_schema.schemata where schema_name = 'private'), 'private schema not removed';
  assert exists (select 1 from pg_views where viewname = 'public_contributions'), 'v2 public view not restored';
  assert exists (select 1 from pg_trigger where tgname = 'on_profile_role_change'), 'v2 role guard not restored';
  assert (select count(*) from public.profiles where role = 'admin') >= 1, 'admin lost';
end $$;
