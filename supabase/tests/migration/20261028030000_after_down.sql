do $$ begin
  assert not exists (select 1 from pg_indexes where indexname = 'contributions_one_open_headword'), 'one-open index kept';
end $$;
