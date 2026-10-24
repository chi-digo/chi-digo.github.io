-- Rollback of 20261025010000_review_languages_fk.sql.
alter table public.profile_review_languages drop constraint profile_review_languages_granted_by_fkey;
alter table public.profile_review_languages add constraint profile_review_languages_granted_by_fkey
  foreign key (granted_by) references public.profiles(id);
