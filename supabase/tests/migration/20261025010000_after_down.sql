do $$ begin
  assert (select confdeltype from pg_constraint where conname = 'profile_review_languages_granted_by_fkey') = 'a', 'rollback kept set null';
end $$;
