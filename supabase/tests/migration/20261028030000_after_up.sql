do $$ begin
  assert exists (select 1 from pg_indexes where indexname = 'contributions_one_open_headword'), 'one-open index missing';
  assert exists (select 1 from pg_constraint where conname = 'contributions_author_check'), 'author check missing';
end $$;
