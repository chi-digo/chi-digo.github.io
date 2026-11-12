-- Dictionary example and equivalents fixes (spec 34 §20): stored, public without the reason, anchor and
-- language locked against reviewer edits, and gated by the reviewer's languages.
do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  b2 uuid := '00000000-0000-4000-8000-0000000000b2';
  c2 uuid := '00000000-0000-4000-8000-0000000000c2';
  ex uuid; eq uuid; r jsonb; pub jsonb;
begin
  delete from public.contribution_events where actor_id in (a1, b2) and created_at > now() - interval '1 hour';
  ex := pg_temp.submit(c2, 'example_fix', 'dictionary', 'word', 'mama',
    '{"sense_id":"1","index":0,"dg_key":"0a1b2c3d","dg":"Mama yuko.","en":"Mother is here.","sw":"Mama yupo.","lang":"sw","reason":"Better"}',
    '{"target_path":"senses.1.examples.0","base":{"value":{"dg":"Mama yuko.","en":"Mother is there.","sw":"Mama yuko."}}}');
  eq := pg_temp.submit(c2, 'equivalents_fix', 'dictionary', 'word', 'mama',
    '{"lang":"sw","items":["mama","mzazi"],"reason":"Missing"}', '{"target_path":"equivalents_sw","base":{"value":{"list":["mama"]}}}');
  update public.contributions set held = false where id in (ex, eq);

  -- Public: the anchor and the texts, never the reason.
  select public_payload into pub from public.public_contributions where id = ex;
  assert pub ? 'dg_key' and pub ? 'sw' and not pub ? 'reason', 'example fix public payload: ' || coalesce(pub::text, 'null');
  select public_payload into pub from public.public_contributions where id = eq;
  assert pub->'items' = '["mama","mzazi"]'::jsonb and not pub ? 'reason', 'equivalents public payload: ' || coalesce(pub::text, 'null');

  -- Locked: where the example is, and the language.
  r := pg_temp.review(a1, ex, 'accept', '{"final_payload":{"sense_id":"1","index":1,"dg_key":"0a1b2c3d","dg":"Mama yuko.","en":"x","sw":"y","lang":"sw","reason":"r"}}');
  assert r->>'error' = 'locked_fields', 'example moved by a reviewer: ' || r::text;
  r := pg_temp.review(a1, ex, 'accept', '{"final_payload":{"sense_id":"1","index":0,"dg_key":"ffffffff","dg":"Mama yuko.","en":"x","sw":"y","lang":"sw","reason":"r"}}');
  assert r->>'error' = 'locked_fields', 'anchor changed by a reviewer: ' || r::text;
  r := pg_temp.review(a1, eq, 'accept', '{"final_payload":{"lang":"en","items":["mother"],"reason":"r"}}');
  assert r->>'error' = 'locked_fields', 'list language changed by a reviewer: ' || r::text;
  r := pg_temp.review(a1, ex, 'accept', '{"final_payload":{"sense_id":"1","index":0,"dg_key":"0a1b2c3d","dg":"Mama yuko.","en":"Mother is here.","sw":"Mama yupo hapa.","lang":"sw","reason":"Better"}}');
  assert r->>'status' = 'accepted', 'example fix accept: ' || r::text;

  -- A Swahili fix goes only to reviewers who read Swahili.
  assert not exists (select 1 from public.profile_review_languages where user_id = b2 and lang = 'sw'), 'fixture: b2 reads Swahili';
  r := pg_temp.review(b2, eq, 'accept');
  assert r->>'error' = 'forbidden', 'a reviewer who doesn''t read Swahili decided a Swahili list: ' || r::text;
end $$;
