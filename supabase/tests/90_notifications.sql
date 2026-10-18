-- Second-review requests notify other reviewers in scope and admins, never the first reviewer or the contributor.
do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  r1 uuid := '00000000-0000-4000-8000-0000000000b1';
  r2 uuid := '00000000-0000-4000-8000-0000000000b2';
  m2 uuid := '00000000-0000-4000-8000-0000000000c2';
  cid uuid; r jsonb;
begin
  insert into public.contributions (user_id, type, scope, target_type, target_id, payload, locale, status)
  values (m2, 'plant_name', 'plants', 'plant', 'p-second', '{"name":"pili","choice":"other"}', 'en', 'pending')
  returning id into cid;
  r := public.review_transition(a1, cid, 'accept', '{"needs_second": true}');
  assert r->>'live_status' = 'awaiting_second', 'expected awaiting_second: ' || r::text;
  assert exists (select 1 from public.notifications where contribution_id = cid and kind = 'second_review' and user_id = r1),
    'plants reviewer not told';
  assert not exists (select 1 from public.notifications where contribution_id = cid and kind = 'second_review' and user_id in (a1, m2, r2)),
    'first reviewer, contributor or out-of-scope reviewer told';
  r := public.review_transition(r1, cid, 'second_confirm');
  assert r->>'live_status' in ('live', 'paused'), 'second confirm failed: ' || r::text;
  assert not exists (select 1 from public.notifications where contribution_id = cid and kind = 'second_review' and read_at is null),
    'settled second-review notices still unread';
end $$;

-- Real reviewers never hear about test items.
do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  r1 uuid := '00000000-0000-4000-8000-0000000000b1';
  t1 uuid := '00000000-0000-4000-8000-0000000000e1';
  cid uuid; r jsonb;
begin
  insert into public.contributions (user_id, type, scope, target_type, target_id, payload, locale, status, is_test)
  values (t1, 'plant_name', 'plants', 'plant', '__test__', '{"name":"t","choice":"other"}', 'en', 'pending', true)
  returning id into cid;
  r := public.review_transition(a1, cid, 'accept', '{"needs_second": true}');
  assert not exists (select 1 from public.notifications where contribution_id = cid and user_id = r1), 'real reviewer told about a test item';
end $$;

-- Self-confirm: only an admin, only their own accept, only when nobody else could second it.
do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  r1 uuid := '00000000-0000-4000-8000-0000000000b1';
  r2 uuid := '00000000-0000-4000-8000-0000000000b2';
  m2 uuid := '00000000-0000-4000-8000-0000000000c2';
  cid uuid; r jsonb;
begin
  insert into public.contributions (user_id, type, scope, target_type, target_id, payload, locale, status)
  values (m2, 'plant_name', 'proverbs', 'proverb', 'p-self', '{"name":"x","choice":"other"}', 'en', 'pending')
  returning id into cid;
  r := public.review_transition(a1, cid, 'accept', '{"needs_second": true}');
  -- Other admins exist in production (the owner), so a1 may not self-confirm yet.
  assert not public.can_self_confirm(a1, cid), 'self-confirm allowed while another admin exists';
  -- With every other admin and reviewer out of the picture, a1 may.
  update public.profiles set blocked_at = now() where role in ('admin', 'reviewer') and id <> a1;
  assert public.can_self_confirm(a1, cid), 'self-confirm refused with no other reviewer';
  assert not public.can_self_confirm(r1, cid), 'non-admin may self-confirm';
  r := public.admin_self_confirm(a1, cid);
  assert r->>'live_status' in ('live', 'paused'), 'self-confirm failed: ' || r::text;
  assert exists (select 1 from public.contribution_events where contribution_id = cid and action = 'self_confirm'
                 and details->>'single_reviewed' = 'true'), 'not logged as single-reviewed';
  update public.profiles set blocked_at = null where id <> a1 and blocked_at is not null and id not in ('00000000-0000-4000-8000-0000000000d1');
end $$;
