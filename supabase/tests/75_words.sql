-- Dictionary contributions (spec 34 §15.3): the new-word cap, flags and feedback never accepted
-- (resolved instead), the add_sense sense id at accept, word claimability and the id write-back limits.
create temp table t_wtoken as select gen_random_uuid()::text || gen_random_uuid()::text as token;
insert into private.fold_tokens (token_hash) select encode(sha256(convert_to(token, 'UTF8')), 'hex') from t_wtoken;

do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  b2 uuid := '00000000-0000-4000-8000-0000000000b2';
  c2 uuid := '00000000-0000-4000-8000-0000000000c2';
  c3 uuid := '00000000-0000-4000-8000-0000000000c3';
  tok text := (select token from t_wtoken);
  r jsonb; flag uuid; fb uuid; sense uuid; w uuid; w2 uuid; claim jsonb; nonce uuid; n int; i int;
begin
  -- 1. At most 10 new words a day.
  for i in 1..10 loop
    r := public.submit_contribution(c3, jsonb_build_object('type', 'word_addition', 'scope', 'dictionary', 'target_type', 'word',
      'payload', jsonb_build_object('headword', 'mtest' || chr(96 + i), 'meaning_en', 'test'), 'locale', 'en'));
    assert not r ? 'error', 'word ' || i || ' refused: ' || r::text;
  end loop;
  r := public.submit_contribution(c3, jsonb_build_object('type', 'word_addition', 'scope', 'dictionary', 'target_type', 'word',
    'payload', jsonb_build_object('headword', 'mtestk', 'meaning_en', 'test'), 'locale', 'en'));
  assert r->>'error' = 'limit_words', 'eleventh new word allowed: ' || r::text;
  r := public.submit_contribution(c3, jsonb_build_object('type', 'example_sentence', 'scope', 'dictionary', 'target_type', 'word',
    'target_id', 'mama', 'payload', jsonb_build_object('sense_id', '1', 'dg', 'Mama ariphokpwedza.'), 'locale', 'en'));
  assert not r ? 'error', 'the word cap blocked another type: ' || r::text;

  -- 2. Flags and feedback are never accepted; they are resolved (or declined).
  flag := pg_temp.submit(c2, 'entry_flag', 'dictionary', 'word', 'mama', '{"reason":"wrong_meaning","detail":"x"}');
  r := pg_temp.review(b2, flag, 'accept');
  assert r->>'error' = 'not_acceptable', 'flag accepted: ' || r::text;
  r := pg_temp.review(b2, flag, 'resolve', '{"note":"fixed the meaning"}');
  assert r->>'status' = 'resolved', 'flag not resolved: ' || r::text;
  fb := pg_temp.submit(c2, 'general_feedback', 'feedback', 'page', '/x', '{"text":"hello"}');
  r := pg_temp.review(a1, fb, 'accept');
  assert r->>'error' = 'not_acceptable', 'feedback accepted: ' || r::text;
  r := pg_temp.review(a1, fb, 'resolve', '{"note":"done"}');
  assert r->>'status' = 'resolved', 'feedback not resolved: ' || r::text;
  w := pg_temp.submit(c2, 'example_sentence', 'dictionary', 'word', 'mama', '{"sense_id":"1","dg":"Mama yuko."}');
  r := pg_temp.review(b2, w, 'resolve');
  assert r->>'error' = 'conflict', 'a content change was resolved: ' || r::text;

  -- 3. A new sense gets its id at accept; anything but senses.N is ignored.
  sense := pg_temp.submit(c2, 'definition_update', 'dictionary', 'word', 'mama', '{"sense_id":"1","lang":"en","text":"x","mode":"add_sense"}');
  r := pg_temp.review(b2, sense, 'accept', '{"target_path":"senses.9"}');
  assert r->>'status' = 'accepted', 'add_sense not accepted: ' || r::text;
  assert (select target_path from public.contributions where id = sense) = 'senses.9', 'sense id not stored';
  w := pg_temp.submit(c2, 'definition_update', 'dictionary', 'word', 'mama', '{"sense_id":"1","lang":"en","text":"y","mode":"replace"}',
    '{"target_path":"senses.1.definition_en"}');
  r := pg_temp.review(b2, w, 'accept', '{"target_path":"senses.7"}');
  assert (select target_path from public.contributions where id = w) = 'senses.1.definition_en', 'replace path overwritten';

  -- 4. Word changes are claimed by fold-in, and a new word's real id is written back only within limits.
  w := pg_temp.submit(c2, 'word_addition', 'dictionary', 'word', null, '{"headword":"Mzzzz","meaning_en":"test"}');
  w2 := pg_temp.submit(c2, 'word_addition', 'dictionary', 'word', null, '{"headword":"-ntest","meaning_en":"affix"}');
  perform pg_temp.review(b2, w, 'accept');
  perform pg_temp.review(b2, w2, 'accept');
  claim := public.fold_claim(tok);
  nonce := (claim->>'nonce')::uuid;
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = w), 'new word not claimable';
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = sense), 'word edit not claimable';
  assert not exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = flag), 'a flag was claimed';

  n := public.fold_mark(tok, nonce, array[w, w2], 'in_preview', 5, null, null,
    jsonb_build_object(w::text, 'mzzzz.2', w2::text, 'other', sense::text, 'mama'));
  assert n = 2, 'in_preview count ' || n;
  assert (select target_id from public.contributions where id = w) = 'mzzzz.2', 'new word id not written back';
  assert (select target_id from public.contributions where id = w2) is null, 'an id that is not the sort key was written';
  assert (select target_id from public.contributions where id = sense) = 'mama', 'a non-new-word target changed';

  -- Values that break the rules are ignored: a path, too long, another run's row.
  update public.contributions set target_id = null where id = w;
  n := public.fold_mark(tok, nonce, array[w], 'in_preview', 5, null, null, jsonb_build_object(w::text, '../mzzzz'));
  assert (select target_id from public.contributions where id = w) is null, 'a path was written as an id';
  n := public.fold_mark(tok, gen_random_uuid(), array[w2], 'in_preview', 5, null, null, jsonb_build_object(w2::text, 'ntest'));
  assert (select target_id from public.contributions where id = w2) is null, 'another nonce wrote an id';
  n := public.fold_mark(tok, nonce, array[w2], 'in_preview', 5, null, null, jsonb_build_object(w2::text, 'ntest'));
  assert (select target_id from public.contributions where id = w2) = 'ntest', 'affix sort key (no hyphen) not accepted';
end;
$$;
