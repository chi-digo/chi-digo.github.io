create or replace function private.notify_second_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, kind, contribution_id)
  select distinct p.id, 'second_review', new.id
  from public.profiles p
  left join public.profile_review_scopes s on s.user_id = p.id
  where p.deleted_at is null and p.blocked_at is null
    and p.id is distinct from new.reviewer_id
    and p.id is distinct from new.user_id
    and (p.role = 'admin' or (p.role = 'reviewer' and (s.scope = new.scope or s.scope = 'all')));
  return null;
end;
$$;
drop trigger if exists notify_second_review on public.contributions;
create trigger notify_second_review
  after update of live_status on public.contributions
  for each row
  when (new.live_status = 'awaiting_second' and old.live_status is distinct from 'awaiting_second' and not new.is_test)
  execute function private.notify_second_review();
