-- Translation fixes (spec 34 §17, phase 5a): reviewer languages, the 7-day overdue notice, and private
-- reasons kept out of the fold-in claim.
create temp table t_ttoken as select gen_random_uuid()::text || gen_random_uuid()::text as token;
insert into private.fold_tokens (token_hash) select encode(sha256(convert_to(token, 'UTF8')), 'hex') from t_ttoken;

do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  r1 uuid := '00000000-0000-4000-8000-0000000000b1';
  c2 uuid := '00000000-0000-4000-8000-0000000000c2';
  tok text := (select token from t_ttoken);
  r2 uuid := '00000000-0000-4000-8000-0000000000b2';
  r jsonb; fx uuid; old uuid; sec uuid; pi uuid; uf uuid; claim jsonb; n int; before int;
begin
  -- 1. A Digo fix needs a reviewer who reads Digo: the scope alone is not enough.
  insert into public.profile_review_scopes (user_id, scope) values (r1, 'translations');
  fx := pg_temp.submit(c2, 'translation_fix', 'translations', 'plant', 'mnazi',
    '{"lang":"dg","field":"teaser","proposed":"Adigo ana dzina kpwa chila hatua ya nazi.","reason":"Better Digo"}',
    '{"target_path":"teaser.dg","base":{"value":{"text":"old"}}}');
  r := pg_temp.review(r1, fx, 'claim');
  assert r->>'error' = 'forbidden', 'a reviewer without Digo claimed a Digo fix: ' || r::text;
  insert into public.profile_review_languages (user_id, lang) values (r1, 'sw');
  r := pg_temp.review(r1, fx, 'claim');
  assert r->>'error' = 'forbidden', 'a Swahili reader claimed a Digo fix: ' || r::text;
  insert into public.profile_review_languages (user_id, lang) values (r1, 'dg');
  r := pg_temp.review(r1, fx, 'claim');
  assert r->>'ok' = 'true', 'a Digo reader could not claim a Digo fix: ' || r::text;
  r := pg_temp.review(r1, fx, 'release');
  -- A reviewer edit can't move the fix to another block or language.
  r := pg_temp.review(a1, fx, 'accept', '{"final_payload":{"lang":"sw","field":"teaser","proposed":"x","reason":"y"}}');
  assert r->>'error' = 'locked_fields', 'a reviewer changed the language of a fix: ' || r::text;
  -- A section correction on a Digo page is a translation too.
  pi := pg_temp.submit(c2, 'plant_info', 'plants', 'plant', 'mbuyu', '{"section":"uses","lang":"dg","mode":"replace","text":"Matumizi."}');
  delete from public.profile_review_languages where user_id = r1;
  r := pg_temp.review(r1, pi, 'claim');
  assert r->>'error' = 'forbidden', 'a reviewer without Digo claimed a Digo section correction: ' || r::text;
  insert into public.profile_review_languages (user_id, lang) values (r1, 'dg');

  -- 2. Nobody picks a fix up for 7 days: each admin is told once.
  old := pg_temp.submit(c2, 'translation_fix', 'translations', 'glossary', 'muhi',
    '{"lang":"sw","field":"definition","proposed":"Shina la mmea.","reason":"Shorter"}', '{"target_path":"definition.sw"}');
  update public.contributions set created_at = now() - interval '8 days' where id = old;
  delete from public.app_settings where key = 'translation_overdue_checked_at';
  before := (select count(*) from public.notifications where kind = 'translation_overdue' and contribution_id = old);
  n := public.notify_overdue_translations();
  assert (select count(*) from public.notifications where kind = 'translation_overdue' and contribution_id = old and user_id = a1) = 1, 'admin not told about an overdue fix';
  perform public.notify_overdue_translations();
  assert (select count(*) from public.notifications where kind = 'translation_overdue' and contribution_id = old and user_id = a1) = 1, 'overdue notice repeated';
  assert not exists (select 1 from public.notifications where kind = 'translation_overdue' and contribution_id = fx), 'a recent fix was reported overdue';

  -- Second review: only reviewers who read the language are told, and only they count against self-confirm.
  insert into public.profile_review_scopes (user_id, scope) values (r2, 'translations');
  sec := pg_temp.submit(c2, 'translation_fix', 'translations', 'glossary', 'muhi',
    '{"lang":"dg","field":"definition","proposed":"Kolo ra mmea, kula photsi.","reason":"Clearer"}', '{"target_path":"definition.dg"}');
  r := pg_temp.review(a1, sec, 'accept', '{"needs_second":true}');
  assert r->>'live_status' = 'awaiting_second', 'not awaiting a second review: ' || r::text;
  assert exists (select 1 from public.notifications where user_id = r1 and kind = 'second_review' and contribution_id = sec), 'the Digo reader was not asked';
  assert not exists (select 1 from public.notifications where user_id = r2 and kind = 'second_review' and contribution_id = sec), 'a reviewer without Digo was asked';

  -- Article fixes: the block is locked, and accepted ones are claimable.
  pi := pg_temp.submit(c2, 'translation_fix', 'translations', 'article', 'culture/kayas/governance',
    '{"lang":"sw","field":"block","block":"b002","proposed":"Aya mpya.","reason":"Better"}', '{"target_path":"blocks.b002.sw"}');
  r := pg_temp.review(a1, pi, 'accept', '{"final_payload":{"lang":"sw","field":"block","block":"b003","proposed":"Aya mpya.","reason":"Better"}}');
  assert r->>'error' = 'locked_fields', 'a reviewer moved an article fix to another block: ' || r::text;
  r := pg_temp.review(a1, pi, 'accept');
  assert r->>'status' = 'accepted', 'article fix accept: ' || r::text;

  -- Interface strings: the key is locked, the admin can't confirm alone, and an accepted one folds.
  uf := pg_temp.submit(c2, 'translation_fix', 'translations', 'ui', '/culture',
    '{"lang":"sw","field":"ui","key":"nav.home","proposed":"Mwanzo","reason":"Better"}', '{"target_path":"nav.home","base":{"value":{"text":"Nyumbani"}}}');
  r := pg_temp.review(a1, uf, 'accept', '{"final_payload":{"lang":"sw","field":"ui","key":"nav.culture","proposed":"Mwanzo","reason":"Better"}}');
  assert r->>'error' = 'locked_fields', 'a reviewer changed the key: ' || r::text;
  r := pg_temp.review(a1, uf, 'accept', '{"needs_second":true}');
  assert r->>'live_status' = 'awaiting_second', 'interface fix not awaiting a second review: ' || r::text;
  delete from public.profile_review_scopes where user_id in (r1, r2);
  assert not public.can_self_confirm(a1, uf), 'an admin could confirm an interface fix alone';
  insert into public.profile_review_scopes (user_id, scope) values (r1, 'plants'), (r1, 'translations'), (r2, 'dictionary'), (r2, 'translations');

  -- 3. Accepted fixes are claimed by fold-in without their private reason.
  r := pg_temp.review(a1, fx, 'accept');
  assert r->>'status' = 'accepted', 'accept failed: ' || r::text;
  claim := public.fold_claim(tok);
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = fx), 'translation fix not claimable';
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = pi), 'article fix not claimable';
  -- (sec is a glossary fix awaiting its second review: not claimable until live.)
  r := pg_temp.review(r1, sec, 'second_confirm');
  assert r->>'live_status' = 'live', 'second review by the Digo reader failed: ' || r::text;
  claim := public.fold_claim(tok);
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = sec), 'glossary fix not claimable';
  assert not exists (select 1 from jsonb_array_elements(claim->'rows') e where e->'final_payload' ? 'reason'), 'a reason reached the fold-in claim';
end;
$$;
