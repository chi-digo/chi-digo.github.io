-- Agreements (own, held, counted by account age) and reports (3 hide a suggestion).
do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  m1 uuid := '00000000-0000-4000-8000-0000000000c1';
  m2 uuid := '00000000-0000-4000-8000-0000000000c2';
  m3 uuid := '00000000-0000-4000-8000-0000000000c3';
  target uuid; r jsonb;
begin
  target := pg_temp.submit(m3, 'plant_name', 'plants', 'plant', 'p-agree', '{"name":"agree","choice":"other"}');
  r := public.agree_contribution(m3, target, 'tanga', 'native');
  assert r->>'error' = 'own', 'agreed with own: ' || r::text;
  r := public.agree_contribution(m1, target, 'tanga', 'heard');
  assert (r->>'agree_count')::int = 0, 'new account agreement counted: ' || r::text;
  assert (select raw_agree_count from public.contributions where id = target) = 1, 'raw count not kept';
  r := public.agree_contribution(m2, target, 'kwale_south', 'native');
  assert (r->>'agree_count')::int = 1, 'old account agreement not counted: ' || r::text;
  r := public.agree_contribution(m2, target, 'kwale_south', 'native');
  assert (r->>'agree_count')::int = 1, 'agreed twice';
  r := public.unagree_contribution(m2, target);
  assert (r->>'agree_count')::int = 0, 'unagree failed';

  -- Held suggestions can't be agreed with or reported.
  r := public.agree_contribution(m2, (select id from public.contributions where user_id = '00000000-0000-4000-8000-0000000000e1' limit 1), null, null);
  assert r->>'error' = 'not_found', 'agreed with a non-public row';

  -- Three reports hide it and tell the admins.
  perform public.report_contribution(m1, target, 'spam');
  perform public.report_contribution(m2, target, 'spam');
  r := public.report_contribution(a1, target, 'offensive');
  assert (r->>'hidden')::boolean, 'not hidden after 3 reports';
  assert (select hidden_at from public.contributions where id = target) is not null, 'hidden_at not set';
  assert exists (select 1 from public.notifications where contribution_id = target and kind = 'report_hidden'), 'admins not told';
end $$;
