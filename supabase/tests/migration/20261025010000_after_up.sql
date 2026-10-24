do $$ begin
  assert (select confdeltype from pg_constraint where conname = 'profile_review_languages_granted_by_fkey') = 'n', 'granted_by is not set null on delete';
end $$;
