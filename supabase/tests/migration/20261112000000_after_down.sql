do $$ begin
  assert pg_get_constraintdef((select oid from pg_constraint where conname = 'contributions_type_check')) not like '%example_fix%', 'type kept';
end $$;
