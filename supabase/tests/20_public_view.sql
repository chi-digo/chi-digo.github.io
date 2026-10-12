-- The public panel: region only, no identities, nothing held, hidden, private or from blocked users; PII masked.
do $$
declare
  m2 uuid := '00000000-0000-4000-8000-0000000000c2';
  m3 uuid := '00000000-0000-4000-8000-0000000000c3';
  vis uuid; fb uuid; flag uuid; hid uuid; pii uuid;
begin
  -- m3 gets one accepted suggestion so later ones aren't held.
  insert into public.contributions (user_id, type, scope, target_type, target_id, payload, locale, status)
  values (m3, 'plant_name', 'plants', 'plant', 'p-old', '{"name":"old","choice":"other"}', 'en', 'accepted');
  vis := pg_temp.submit(m3, 'plant_name', 'plants', 'plant', 'p-view', '{"name":"mutsu","choice":"other","other_names":"call 0712 345 678"}', '{"village":"Kinondo","note":"secret note","credit_opt_in":true}');
  pii := pg_temp.submit(m3, 'plant_info', 'plants', 'plant', 'p-view', '{"section":"uses","text":"see https://spam.example or mail me@x.co"}');
  fb := pg_temp.submit(m3, 'general_feedback', 'feedback', 'page', '/x', '{"text":"private feedback"}');
  flag := pg_temp.submit(m3, 'entry_flag', 'dictionary', 'word', 'kpwera', '{"reason":"offensive"}');
  hid := pg_temp.submit(m3, 'plant_name', 'plants', 'plant', 'p-view', '{"name":"hidden","choice":"other"}');
  update public.contributions set hidden_at = now() where id = hid;
  insert into t_ids values ('m3_visible', vis), ('m3_pii', pii);
  -- A test account's row on a real target never shows, even when not held.
  update public.contributions set held = false, target_id = 'p-test-real' where id = (select id from t_ids where name = 'test_row');
end $$;

set local role anon;
do $$
declare n int; p jsonb;
begin
  select count(*) into n from public.public_contributions where target_id = 'p-view';
  assert n = 2, 'expected 2 public rows on p-view, got ' || n;
  assert not exists (select 1 from public.public_contributions where target_id in ('/x', 'kpwera')), 'feedback or flag is public';
  assert not exists (select 1 from public.public_contributions where target_id = 'p-test-real'), 'test row on a real target is public';
  assert not exists (select 1 from public.public_contributions where target_id like 'p-limit-%' and target_id in ('p-limit-1','p-limit-2','p-limit-3')), 'held rows are public';
  select public_payload into p from public.public_contributions where target_id = 'p-view' and type = 'plant_info';
  assert p->>'text' not like '%spam.example%' and p->>'text' not like '%me@x.co%', 'PII not masked: ' || p::text;
  select public_payload into p from public.public_contributions where target_id = 'p-view' and type = 'plant_name';
  assert p->>'other_names' not like '%0712%', 'phone not masked: ' || p::text;
  assert not (p ? 'note'), 'note leaked';
end $$;
reset role;

do $$
begin
  assert not exists (select 1 from information_schema.columns where table_name = 'public_contributions'
                     and column_name in ('user_id', 'village', 'note', 'base', 'recorded_for', 'payload')), 'public view exposes private columns';
  -- Blocked contributors disappear from the panel.
  update public.profiles set blocked_at = now() where id = '00000000-0000-4000-8000-0000000000c3';
  assert not exists (select 1 from public.public_contributions where target_id = 'p-view'), 'blocked user still public';
  update public.profiles set blocked_at = null where id = '00000000-0000-4000-8000-0000000000c3';
end $$;
