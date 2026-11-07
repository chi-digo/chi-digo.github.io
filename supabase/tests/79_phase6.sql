-- Phase 6 (spec 34 §19): the widened "confirm alone" switch, rate caps (admin 150, reviewer 60, declines 100),
-- quiet bulk decisions and the batch message, the accepted-interface-fix view, and report counting.
do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  b1 uuid := '00000000-0000-4000-8000-0000000000b1';
  c1 uuid := '00000000-0000-4000-8000-0000000000c1';
  c2 uuid := '00000000-0000-4000-8000-0000000000c2';
  c3 uuid := '00000000-0000-4000-8000-0000000000c3';
  others uuid[];
  art uuid; uf uuid; uf2 uuid; d uuid; p uuid; r jsonb; n int;
begin
  -- No other reviewer may stand in as the second voice inside this rolled-back test.
  others := array(select id from public.profiles where role = 'admin' and id <> a1);
  update public.profiles set role = 'member' where id = any(others);
  update public.app_settings set value = 'false' where key = 'ui_self_confirm';
  -- Earlier test files used up the test reviewers' hourly accepts.
  delete from public.contribution_events where actor_id in (a1, b1) and created_at > now() - interval '1 hour';

  -- 1. Confirm alone. An article fix that needs a second voice, with another reviewer who reads Swahili.
  insert into public.profile_review_scopes (user_id, scope) values (b1, 'translations') on conflict do nothing;
  insert into public.profile_review_languages (user_id, lang) values (b1, 'sw') on conflict do nothing;
  art := pg_temp.submit(c2, 'translation_fix', 'translations', 'article', 'culture/kayas/governance',
    '{"lang":"sw","field":"block","block":"b002","proposed":"Aya ya majaribio.","reason":"Better"}', '{"target_path":"blocks.b002.sw"}');
  r := pg_temp.review(a1, art, 'accept', '{"needs_second":true}');
  assert r->>'live_status' = 'awaiting_second', 'not awaiting a second voice: ' || r::text;
  assert not public.can_self_confirm(a1, art), 'switch off: confirmed alone while another reviewer could';
  update public.app_settings set value = 'true' where key = 'ui_self_confirm';
  assert public.can_self_confirm(a1, art), 'switch on: the admin could not confirm alone';
  r := public.admin_self_confirm(a1, art);
  assert r->>'live_status' = 'live', 'self-confirm with the switch on failed: ' || r::text;
  -- Only an accept the admin made, and only an admin.
  uf := pg_temp.submit(c2, 'translation_fix', 'translations', 'ui', '/culture',
    '{"lang":"sw","field":"ui","key":"nav.home","proposed":"Mwanzo","reason":"Better"}', '{"target_path":"nav.home","base":{"value":{"text":"Nyumbani"}}}');
  r := pg_temp.review(b1, uf, 'accept');
  assert r->>'live_status' = 'awaiting_second', 'interface accept: ' || r::text;
  assert not public.can_self_confirm(b1, uf), 'a reviewer confirmed alone';
  assert not public.can_self_confirm(a1, uf), 'an admin confirmed someone else''s accept alone';
  update public.app_settings set value = 'false' where key = 'ui_self_confirm';

  -- 2. Accepted interface fixes waiting for the update: only live (or paused), fixed columns, no id.
  assert not exists (select 1 from public.public_ui_accepted where key = 'nav.home'), 'a fix awaiting its second voice was listed';
  r := pg_temp.review(a1, uf, 'second_confirm');
  assert r->>'live_status' = 'live', 'second confirm: ' || r::text;
  assert exists (select 1 from public.public_ui_accepted where key = 'nav.home' and lang = 'sw' and proposed = 'Mwanzo'), 'accepted fix not listed';
  assert (select array_agg(column_name::text order by ordinal_position) from information_schema.columns
          where table_schema = 'public' and table_name = 'public_ui_accepted') = array['key', 'lang', 'proposed'], 'view columns changed';
  update public.contributions set fold_status = 'folded' where id = uf;
  assert not exists (select 1 from public.public_ui_accepted where key = 'nav.home'), 'a folded fix was still listed';

  -- 3. Quiet bulk decisions, then one message per contributor.
  uf2 := pg_temp.submit(c3, 'translation_fix', 'translations', 'ui', '/history',
    '{"lang":"sw","field":"ui","key":"nav.history","proposed":"Historia yetu","reason":"Better"}', '{"target_path":"nav.history","base":{"value":{"text":"Historia"}}}');
  d := pg_temp.submit(c3, 'translation_fix', 'translations', 'ui', '/history',
    '{"lang":"sw","field":"ui","key":"nav.culture","proposed":"Mila","reason":"Better"}', '{"target_path":"nav.culture","base":{"value":{"text":"Utamaduni"}}}');
  delete from public.notifications where user_id = c3;
  r := pg_temp.review(a1, uf2, 'accept', '{"quiet":true}');
  r := pg_temp.review(a1, d, 'decline', '{"quiet":true}');
  assert r->>'status' = 'declined', 'quiet decline: ' || r::text;
  assert not exists (select 1 from public.notifications where user_id = c3), 'a quiet decision sent a message';
  n := public.notify_batch(array[uf2, d]);
  assert n = 1, 'batch messages: ' || n;
  assert (select details from public.notifications where user_id = c3 and kind = 'batch') = '{"accepted":1,"declined":1}'::jsonb, 'batch counts wrong';

  -- 4. Rate caps: an admin accepts 150 an hour, declines 100.
  insert into public.contribution_events (actor_id, action) select a1, 'accept' from generate_series(1, 150);
  p := pg_temp.submit(c2, 'plant_name', 'plants', 'plant', 'p-cap', '{"name":"kapu","choice":"other"}');
  r := pg_temp.review(a1, p, 'accept');
  assert r->>'error' = 'rate_cap', 'admin went past 150 accepts: ' || r::text;
  delete from public.contribution_events where actor_id = a1 and action = 'accept';
  insert into public.contribution_events (actor_id, action) select a1, 'decline' from generate_series(1, 100);
  r := pg_temp.review(a1, p, 'decline');
  assert r->>'error' = 'rate_cap', 'went past 100 declines: ' || r::text;

  -- 5. Reports from new accounts don't hide a suggestion; three from older accounts do.
  p := pg_temp.submit(c2, 'plant_name', 'plants', 'plant', 'p-rep', '{"name":"ripoti","choice":"other"}');
  update public.contributions set held = false where id = p;
  r := public.report_contribution(c1, p, 'spam');
  assert not (r->>'hidden')::boolean, 'a new account''s report counted';
  r := public.report_contribution(b1, p, 'spam');
  r := public.report_contribution(c3, p, 'spam');
  assert not (r->>'hidden')::boolean, 'hidden with two counted reports';
  r := public.report_contribution(a1, p, 'spam');
  assert (r->>'hidden')::boolean, 'three older accounts did not hide it: ' || r::text;

  update public.profiles set role = 'admin' where id = any(others);
end $$;
