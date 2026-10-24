-- Deleting an admin must not be blocked by the scopes they granted or the applications they decided:
-- keep the rows, forget who acted (the event log keeps the history).
alter table public.profile_review_scopes drop constraint profile_review_scopes_granted_by_fkey;
alter table public.profile_review_scopes add constraint profile_review_scopes_granted_by_fkey
  foreign key (granted_by) references public.profiles(id) on delete set null;
alter table public.reviewer_applications drop constraint reviewer_applications_decided_by_fkey;
alter table public.reviewer_applications add constraint reviewer_applications_decided_by_fkey
  foreign key (decided_by) references public.profiles(id) on delete set null;
