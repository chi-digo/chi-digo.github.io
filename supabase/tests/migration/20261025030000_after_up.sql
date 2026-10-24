do $$ begin
  assert (select confdeltype from pg_constraint where conname = 'profile_review_scopes_granted_by_fkey') = 'n', 'scopes granted_by not set null';
  assert (select confdeltype from pg_constraint where conname = 'reviewer_applications_decided_by_fkey') = 'n', 'applications decided_by not set null';
end $$;
