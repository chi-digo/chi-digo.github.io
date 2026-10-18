-- Owner decision 2026-10-16: an admin may confirm their own accept when no other reviewer covers the
-- item; the log marks it single-reviewed. As soon as another reviewer exists, two voices are required.
-- Also: read the test flag as jsonb equality (a non-boolean value must not break accepts).

-- Whether anyone other than the first reviewer and the contributor could give the second review.
create or replace function private.has_other_second_reviewer(c public.contributions)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profile_review_scopes s on s.user_id = p.id
    where p.deleted_at is null and p.blocked_at is null
      and p.id is distinct from c.reviewer_id
      and p.id is distinct from c.user_id
      and coalesce(u.raw_app_meta_data->'test' = 'true'::jsonb, false) = c.is_test
      and (p.role = 'admin' or (p.role = 'reviewer' and (s.scope = c.scope or s.scope = 'all'))));
$$;

create or replace function public.can_self_confirm(p_uid uuid, p_cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.contributions c
    join public.profiles me on me.id = p_uid
    where c.id = p_cid and c.status = 'accepted' and c.live_status = 'awaiting_second' and c.reviewer_id = p_uid
      and me.role = 'admin' and me.deleted_at is null and me.blocked_at is null
      and not private.has_other_second_reviewer(c));
$$;

create or replace function public.admin_self_confirm(p_uid uuid, p_cid uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.contributions;
  paused boolean;
begin
  if not public.can_self_confirm(p_uid, p_cid) then
    return jsonb_build_object('error', 'conflict');
  end if;
  select coalesce((value #>> '{}')::boolean, false) into paused from public.app_settings where key = 'publishing_paused';
  update public.contributions
  set live_status = case when paused and not is_test then 'paused' else 'live' end,
      second_reviewer_id = p_uid, second_reviewed_at = now()
  where id = p_cid and live_status = 'awaiting_second'
  returning * into c;
  if not found then return jsonb_build_object('error', 'conflict'); end if;
  perform private.log_event(p_uid, 'self_confirm', p_cid, c.user_id, jsonb_build_object('single_reviewed', true), c.is_test);
  return jsonb_build_object('ok', true, 'status', c.status, 'live_status', c.live_status);
end;
$$;

revoke execute on function private.has_other_second_reviewer(public.contributions) from public, anon, authenticated;
revoke execute on function public.can_self_confirm(uuid, uuid), public.admin_self_confirm(uuid, uuid) from public, anon, authenticated;
grant execute on function public.can_self_confirm(uuid, uuid), public.admin_self_confirm(uuid, uuid) to service_role;

-- Same test-flag reading in the second-review notice.
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
    and coalesce(u.raw_app_meta_data->'test' = 'true'::jsonb, false) = new.is_test
    and (p.role = 'admin' or (p.role = 'reviewer' and (s.scope = new.scope or s.scope = 'all')));
  return null;
end;
$$;
