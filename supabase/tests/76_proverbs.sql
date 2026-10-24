-- Proverb contributions (spec 34 §16 v2): the new-proverb cap, locked fields, ids reserved at accept and
-- never reused, merge rules, claimability, and suggestions closed when a new proverb is removed.
create temp table t_ptoken as select gen_random_uuid()::text || gen_random_uuid()::text as token;
insert into private.fold_tokens (token_hash) select encode(sha256(convert_to(token, 'UTF8')), 'hex') from t_ptoken;

do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  c2 uuid := '00000000-0000-4000-8000-0000000000c2';
  c3 uuid := '00000000-0000-4000-8000-0000000000c3';
  b1 uuid := '00000000-0000-4000-8000-0000000000b1';
  tok text := (select token from t_ptoken);
  r jsonb; m uuid; p1 uuid; p2 uuid; dup uuid; sug uuid; claim jsonb; n int; i int; hwm int; id1 text; id2 text;
begin
  update public.profile_review_scopes set scope = scope where false; -- (fixtures: a1 admin reviews everything)

  -- 1. At most 10 new proverbs a day.
  for i in 1..10 loop
    r := public.submit_contribution(c3, jsonb_build_object('type', 'proverb_addition', 'scope', 'proverbs', 'target_type', 'proverb',
      'payload', jsonb_build_object('digo', 'Methali ya majaribio ' || chr(96 + i), 'meaning_en', 'test'), 'locale', 'en'));
    assert not r ? 'error', 'proverb ' || i || ' refused: ' || r::text;
  end loop;
  r := public.submit_contribution(c3, jsonb_build_object('type', 'proverb_addition', 'scope', 'proverbs', 'target_type', 'proverb',
    'payload', jsonb_build_object('digo', 'Methali ya kumi na mwenga', 'meaning_en', 'test'), 'locale', 'en'));
  assert r->>'error' = 'limit_proverbs', 'eleventh new proverb allowed: ' || r::text;

  -- 2. Locked fields.
  m := pg_temp.submit(c2, 'proverb_meaning', 'proverbs', 'proverb', 'p-001', '{"lang":"en","kind":"idiomatic","mode":"replace","text":"x"}');
  r := pg_temp.review(a1, m, 'accept', '{"final_payload":{"lang":"sw","kind":"idiomatic","mode":"replace","text":"x"}}');
  assert r->>'error' = 'locked_fields', 'language changed by a reviewer: ' || r::text;
  r := pg_temp.review(a1, m, 'accept', '{"final_payload":{"lang":"en","kind":"literal","mode":"replace","text":"x"}}');
  assert r->>'error' = 'locked_fields', 'kind changed by a reviewer: ' || r::text;
  r := pg_temp.review(a1, m, 'accept', '{"final_payload":{"lang":"en","kind":"idiomatic","mode":"replace","text":"x, corrected"}}');
  assert r->>'status' = 'accepted', 'text correction refused: ' || r::text;

  -- 3. New proverb ids are reserved at accept, in order, and never reused after a revert.
  hwm := (select (value #>> '{}')::int from public.app_settings where key = 'proverb_id_hwm');
  p1 := pg_temp.submit(c2, 'proverb_addition', 'proverbs', 'proverb', null, '{"digo":"Mvula ya kare tainyesa","meaning_en":"old rain"}');
  p2 := pg_temp.submit(c2, 'proverb_addition', 'proverbs', 'proverb', null, '{"digo":"Dzuwa ra muhondo","meaning_en":"tomorrow"}');
  dup := pg_temp.submit(b1, 'proverb_addition', 'proverbs', 'proverb', null, '{"digo":"Mvula ya kare, tainyesa!","meaning_en":"same"}');
  r := pg_temp.review(a1, p1, 'accept', jsonb_build_object('merge_ids', jsonb_build_array(dup, p2)));
  id1 := (select target_id from public.contributions where id = p1);
  assert id1 = 'p-' || lpad((hwm + 1)::text, 3, '0'), 'unexpected reserved id ' || coalesce(id1, 'null');
  assert (select status from public.contributions where id = dup) = 'duplicate', 'same-text new proverb not merged';
  assert (select status from public.contributions where id = p2) = 'pending', 'a different new proverb was merged away';
  r := pg_temp.review(a1, p2, 'accept');
  id2 := (select target_id from public.contributions where id = p2);
  assert id2 = 'p-' || lpad((hwm + 2)::text, 3, '0'), 'second reserved id ' || coalesce(id2, 'null');
  assert (select (value #>> '{}')::int from public.app_settings where key = 'proverb_id_hwm') = hwm + 2, 'high-water mark not advanced';
  -- An accept that does not go through (already accepted) spends no id.
  r := pg_temp.review(a1, p2, 'accept');
  assert r->>'error' = 'conflict', 'second accept of the same proverb: ' || r::text;
  assert (select (value #>> '{}')::int from public.app_settings where key = 'proverb_id_hwm') = hwm + 2, 'a failed accept spent an id';

  -- A suggestion on the new proverb, then the proverb is reverted before fold-in: the id is not reused,
  -- and the open suggestion is closed.
  sug := pg_temp.submit(c3, 'proverb_variant', 'proverbs', 'proverb', id1, '{"form":"Mvula ya kare"}');
  r := pg_temp.review(a1, p1, 'revert');
  assert r->>'status' = 'reverted', 'revert of an unfolded new proverb: ' || r::text;
  assert (select status from public.contributions where id = sug) = 'declined', 'suggestion on a removed proverb left open';
  p1 := pg_temp.submit(c2, 'proverb_addition', 'proverbs', 'proverb', null, '{"digo":"Ndzala tayina masikiro","meaning_en":"hunger"}');
  r := pg_temp.review(a1, p1, 'accept');
  assert (select target_id from public.contributions where id = p1) = 'p-' || lpad((hwm + 3)::text, 3, '0'), 'a reverted id was reused';

  -- 4. Proverb changes are claimed by fold-in; tests and flags never are.
  claim := public.fold_claim(tok);
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = p2), 'new proverb not claimable';
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = m), 'proverb edit not claimable';
end;
$$;
