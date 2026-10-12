-- submit_contribution: limits, held, blocked, test flag, avatar sanitising at sign-up.
do $$
declare
  m1 uuid := '00000000-0000-4000-8000-0000000000c1';
  m2 uuid := '00000000-0000-4000-8000-0000000000c2';
  r jsonb;
  i int;
  new_id uuid;
begin
  -- Sign-up sanitised a non-Google picture and kept the first name.
  assert (select avatar_url from public.profiles where id = m2) is null, 'non-Google avatar kept';
  assert (select first_name from public.profiles where id = m2) = 'Mbaraka', 'first name not set';

  -- A new account (m1, created today) may submit 5 a day; held while it has no accepted suggestion.
  for i in 1..5 loop
    new_id := pg_temp.submit(m1, 'plant_name', 'plants', 'plant', 'p-limit-' || i, jsonb_build_object('name', 'jina' || i, 'choice', 'other'));
    if i = 1 then insert into t_ids values ('m1_first', new_id); end if;
  end loop;
  assert (select count(*) from public.contributions where user_id = m1 and held) = 3, 'first 3 should be held';
  assert (select count(*) from public.contributions where user_id = m1 and not held) = 2, '4th and 5th should be public';
  r := public.submit_contribution(m1, '{"type":"general_feedback","scope":"feedback","payload":{"text":"x"},"locale":"en"}');
  assert r->>'error' = 'limit_day', 'new-account daily limit not enforced: ' || r::text;

  -- Per-target open limit (m2, older account).
  for i in 1..5 loop
    perform pg_temp.submit(m2, 'plant_info', 'plants', 'plant', 'p-target', jsonb_build_object('section', 'uses', 'text', 'matumizi ' || i));
  end loop;
  r := public.submit_contribution(m2, '{"type":"plant_info","scope":"plants","target_type":"plant","target_id":"p-target","payload":{"section":"uses","text":"x"},"locale":"en"}');
  assert r->>'error' = 'limit_target', 'per-target limit not enforced: ' || r::text;

  -- Blocked users can't submit.
  r := public.submit_contribution('00000000-0000-4000-8000-0000000000d1', '{"type":"general_feedback","scope":"feedback","payload":{"text":"x"},"locale":"en"}');
  assert r->>'error' = 'blocked', 'blocked user submitted';

  -- Flow-test accounts are flagged as test data.
  r := public.submit_contribution('00000000-0000-4000-8000-0000000000e1', '{"type":"plant_name","scope":"plants","target_type":"plant","target_id":"__test__","payload":{"name":"x","choice":"other"},"locale":"en"}');
  assert (r->>'is_test')::boolean, 'test account not flagged';
  insert into t_ids values ('test_row', (r->>'id')::uuid);

  -- Credit is off unless asked for.
  assert not (select credit_opt_in from public.contributions where id = (r->>'id')::uuid), 'credit defaulted on';
end $$;
