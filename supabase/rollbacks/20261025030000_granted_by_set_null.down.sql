-- Rollback of 20261025030000_granted_by_set_null.sql.
alter table public.profile_review_scopes drop constraint profile_review_scopes_granted_by_fkey;
alter table public.profile_review_scopes add constraint profile_review_scopes_granted_by_fkey
  foreign key (granted_by) references public.profiles(id);
alter table public.reviewer_applications drop constraint reviewer_applications_decided_by_fkey;
alter table public.reviewer_applications add constraint reviewer_applications_decided_by_fkey
  foreign key (decided_by) references public.profiles(id);
