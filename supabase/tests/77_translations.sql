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
  r jsonb; fx uuid; old uuid; claim jsonb; n int; before int;
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

  -- 2. Nobody picks a fix up for 7 days: each admin is told once.
  old := pg_temp.submit(c2, 'translation_fix', 'translations', 'glossary', 'muhi',
    '{"lang":"sw","field":"definition","proposed":"Shina la mmea.","reason":"Shorter"}', '{"target_path":"definition.sw"}');
  update public.contributions set created_at = now() - interval '8 days' where id = old;
  before := (select count(*) from public.notifications where kind = 'translation_overdue' and contribution_id = old);
  n := public.notify_overdue_translations();
  assert (select count(*) from public.notifications where kind = 'translation_overdue' and contribution_id = old and user_id = a1) = 1, 'admin not told about an overdue fix';
  perform public.notify_overdue_translations();
  assert (select count(*) from public.notifications where kind = 'translation_overdue' and contribution_id = old and user_id = a1) = 1, 'overdue notice repeated';
  assert not exists (select 1 from public.notifications where kind = 'translation_overdue' and contribution_id = fx), 'a recent fix was reported overdue';

  -- 3. Accepted fixes are claimed by fold-in without their private reason.
  r := pg_temp.review(a1, fx, 'accept');
  assert r->>'status' = 'accepted', 'accept failed: ' || r::text;
  claim := public.fold_claim(tok);
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = fx), 'translation fix not claimable';
  assert not exists (select 1 from jsonb_array_elements(claim->'rows') e where e->'final_payload' ? 'reason'), 'a reason reached the fold-in claim';
end;
$$;
