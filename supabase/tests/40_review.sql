-- review_transition: scope, self-review, claims, pause, second review, held release, revert, rate cap.
update public.app_settings set value = 'true' where key = 'publishing_paused';
do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  r1 uuid := '00000000-0000-4000-8000-0000000000b1';
  r2 uuid := '00000000-0000-4000-8000-0000000000b2';
  m1 uuid := '00000000-0000-4000-8000-0000000000c1';
  m3 uuid := '00000000-0000-4000-8000-0000000000c3';
  vis uuid := (select id from t_ids where name = 'm3_visible');
  first_m1 uuid := (select id from t_ids where name = 'm1_first');
  own uuid; two uuid; r jsonb; i int;
begin
  r := pg_temp.review(r2, vis, 'accept');
  assert r->>'error' = 'forbidden', 'out-of-scope reviewer accepted: ' || r::text;

  own := pg_temp.submit(r1, 'plant_name', 'plants', 'plant', 'p-own', '{"name":"own","choice":"other"}');
  r := pg_temp.review(r1, own, 'accept');
  assert r->>'error' = 'self_review', 'self-review allowed: ' || r::text;

  -- Claims block other reviewers until they expire.
  r := pg_temp.review(r1, vis, 'claim');
  assert (r->>'ok')::boolean, 'claim failed: ' || r::text;
  r := pg_temp.review(a1, vis, 'accept');
  assert r->>'error' = 'conflict', 'accepted through someone else''s claim: ' || r::text;

  -- Publishing starts paused: accepted changes wait, then go live on resume.
  r := pg_temp.review(r1, vis, 'accept', '{"final_payload":{"name":"mutsu","choice":"other"}}');
  assert r->>'live_status' = 'paused', 'expected paused, got ' || r::text;
  assert exists (select 1 from public.notifications where contribution_id = vis and kind = 'accepted'), 'no notification';
  r := public.set_publishing_paused(r1, false);
  assert r->>'error' = 'forbidden', 'non-admin changed publishing';
  r := public.set_publishing_paused(a1, false);
  assert (select live_status from public.contributions where id = vis) = 'live', 'resume did not release';
  insert into t_ids values ('accepted_live', vis);

  -- A second accept on a closed item loses the race.
  r := pg_temp.review(a1, vis, 'decline');
  assert r->>'error' = 'conflict', 'decided twice: ' || r::text;

  -- First accept releases the contributor's held suggestions.
  assert exists (select 1 from public.contributions where user_id = m1 and held), 'm1 should have held rows';
  r := pg_temp.review(a1, first_m1, 'accept');
  assert (r->>'ok')::boolean, 'accept m1 failed: ' || r::text;
  assert not exists (select 1 from public.contributions where user_id = m1 and held), 'held rows not released';

  -- Second review: the first reviewer can't confirm their own accept.
  two := pg_temp.submit(m3, 'plant_name', 'plants', 'plant', 'p-two', '{"name":"two","choice":"other"}');
  r := pg_temp.review(r1, two, 'accept', '{"needs_second":true}');
  assert r->>'live_status' = 'awaiting_second', 'expected awaiting_second: ' || r::text;
  r := pg_temp.review(r1, two, 'second_confirm');
  assert r->>'error' = 'conflict', 'same reviewer confirmed: ' || r::text;
  r := pg_temp.review(a1, two, 'second_confirm');
  assert r->>'live_status' = 'live', 'second confirm failed: ' || r::text;

  -- Reverting an unfolded change is immediate.
  r := pg_temp.review(a1, two, 'revert');
  assert r->>'status' = 'reverted', 'revert failed: ' || r::text;
  r := pg_temp.review(r1, (select id from t_ids where name = 'm3_pii'), 'revert');
  assert r->>'error' in ('forbidden', 'conflict'), 'non-admin reverted';

  -- Duplicates must point at a real contribution.
  r := pg_temp.review(r1, (select id from t_ids where name = 'm3_pii'), 'duplicate', jsonb_build_object('duplicate_of', gen_random_uuid()));
  assert r->>'error' = 'conflict', 'duplicate of nothing accepted';

  -- Rate cap: 60 accepts an hour.
  for i in 1..60 loop
    insert into public.contribution_events (actor_id, action) values (r1, 'accept');
  end loop;
  r := pg_temp.review(r1, (select id from t_ids where name = 'm3_pii'), 'accept');
  assert r->>'error' = 'rate_cap', 'rate cap not enforced: ' || r::text;
end $$;
