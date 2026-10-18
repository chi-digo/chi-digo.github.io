drop function if exists public.admin_self_confirm(uuid, uuid);
drop function if exists public.can_self_confirm(uuid, uuid);
drop function if exists private.has_other_second_reviewer(public.contributions);
create or replace function private.notify_second_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, kind, contribution_id)
  select distinct p.id, 'second_review', new.id
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.profile_review_scopes s on s.user_id = p.id
  where p.deleted_at is null and p.blocked_at is null
    and p.id is distinct from new.reviewer_id
    and p.id is distinct from new.user_id
    and coalesce((u.raw_app_meta_data->>'test')::boolean, false) = new.is_test
    and (p.role = 'admin' or (p.role = 'reviewer' and (s.scope = new.scope or s.scope = 'all')));
  return null;
end;
$$;
