do $$
begin
  assert not exists (select 1 from pg_attribute where attrelid = 'public.my_contributions'::regclass and attname = 'held'), 'held not removed';
end $$;
