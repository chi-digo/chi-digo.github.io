-- Credit is resolved at render time: names only for accepted, credited, live accounts (AC9).
do $$
declare
  m2 uuid := '00000000-0000-4000-8000-0000000000c2';
  cid uuid;
  cr record;
begin
  insert into public.contributions (user_id, type, scope, target_type, target_id, payload, locale, status, credit_opt_in, region, live_status)
  values (m2, 'plant_name', 'plants', 'plant', 'p-credit', '{"name":"credited","choice":"other"}', 'en', 'accepted', true, 'tanga', 'live')
  returning id into cid;

  select * into cr from public.contribution_credits where id = cid;
  assert cr.credited and cr.first_name = 'Mbaraka' and cr.region = 'tanga', 'credited contributor not named: ' || row_to_json(cr)::text;

  update public.contributions set credit_opt_in = false where id = cid;
  select * into cr from public.contribution_credits where id = cid;
  assert not cr.credited and cr.first_name is null and cr.avatar_url is null, 'name shown without consent';

  update public.contributions set credit_opt_in = true where id = cid;
  update public.profiles set blocked_at = now() where id = m2;
  select * into cr from public.contribution_credits where id = cid;
  assert cr.first_name is null, 'blocked contributor still named';
  update public.profiles set blocked_at = null, deleted_at = now() where id = m2;
  select * into cr from public.contribution_credits where id = cid;
  assert cr.first_name is null, 'deleted account still named';
  update public.profiles set deleted_at = null where id = m2;

  -- Pending suggestions never appear in credits.
  update public.contributions set status = 'pending' where id = cid;
  assert not exists (select 1 from public.contribution_credits where id = cid), 'pending row credited';
end $$;
