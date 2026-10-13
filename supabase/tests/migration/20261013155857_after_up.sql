do $$
begin
  assert exists (select 1 from pg_attribute where attrelid = 'public.my_contributions'::regclass and attname = 'held'), 'held missing';
  assert not has_table_privilege('authenticated', 'public.my_contributions', 'update'), 'view writable';
end $$;
