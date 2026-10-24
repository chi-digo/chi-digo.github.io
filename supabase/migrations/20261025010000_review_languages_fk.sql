-- Deleting the admin who granted a reviewer's languages must not be blocked: keep the grant, forget who made it.
alter table public.profile_review_languages drop constraint profile_review_languages_granted_by_fkey;
alter table public.profile_review_languages add constraint profile_review_languages_granted_by_fkey
  foreign key (granted_by) references public.profiles(id) on delete set null;
