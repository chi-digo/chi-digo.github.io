-- "Make this the headword" (spec 34 §18): admin only, from an accepted live form, one at a time per entry,
-- no author, revert guards, fold-in claim order, the new-id write-back and the rows following the entry.
create temp table t_htoken as select gen_random_uuid()::text || gen_random_uuid()::text as token;
insert into private.fold_tokens (token_hash) select encode(sha256(convert_to(token, 'UTF8')), 'hex') from t_htoken;

do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  b2 uuid := '00000000-0000-4000-8000-0000000000b2';
  c2 uuid := '00000000-0000-4000-8000-0000000000c2';
  c3 uuid := '00000000-0000-4000-8000-0000000000c3';
  tok text := (select token from t_htoken);
  base jsonb := '{"base":{"value":{"headword":"hwtesta","id":"hwtesta","homonym_index":null,"sort_key":"hwtesta","file":"h","after":null}}}';
  r jsonb; v uuid; v2 uuid; ex uuid; hc uuid; hc2 uuid; claim jsonb; nonce uuid; n int;
begin
  v := pg_temp.submit(c2, 'spelling_variant', 'dictionary', 'word', 'hwtesta', '{"form":"hwtestb","kind":"spelling"}');
  ex := pg_temp.submit(c3, 'example_sentence', 'dictionary', 'word', 'hwtesta', '{"sense_id":"1","dg":"Hwtesta yuko."}');

  -- 1. Only from an accepted, live form; only an admin.
  r := pg_temp.review(a1, v, 'make_headword', base);
  assert r->>'error' = 'not_acceptable', 'made from a pending form: ' || r::text;
  perform pg_temp.review(b2, v, 'accept');
  perform pg_temp.review(b2, ex, 'accept');
  r := pg_temp.review(b2, v, 'make_headword', base);
  assert r->>'error' = 'forbidden', 'a reviewer made a headword: ' || r::text;
  r := pg_temp.review(a1, v, 'make_headword', '{}');
  assert r->>'error' = 'invalid', 'made with no base: ' || r::text;
  r := pg_temp.review(a1, v, 'make_headword', base);
  assert (r->>'ok')::boolean, 'make_headword failed: ' || r::text;
  hc := (r->>'id')::uuid;

  -- 2. No author; the form is the accepted one; never in anyone's contributions.
  assert (select user_id is null and type = 'headword_change' and status = 'accepted' and live_status = 'live'
                 and final_payload->>'form' = 'hwtestb' and final_payload->>'variant' = v::text
                 and target_id = 'hwtesta' and reviewer_id = a1 and not credit_opt_in
            from public.contributions where id = hc), 'headword change row wrong';
  assert not exists (select 1 from public.my_contributions where id = hc), 'headword change in my contributions';
  assert not exists (select 1 from public.public_contributions where id = hc), 'headword change public';
  assert not exists (select 1 from public.notifications where contribution_id = hc), 'headword change notified someone';
  assert exists (select 1 from public.contribution_events where contribution_id = hc and action = 'make_headword'
                 and details->>'variant' = v::text), 'make_headword not logged';
  -- Submit can never create one (it always has an author).
  begin
    insert into public.contributions (user_id, type, scope, target_type, target_id, payload, locale)
    values (c2, 'headword_change', 'dictionary', 'word', 'hwtesta', '{}', 'en');
    assert false, 'a headword change with an author was stored';
  exception when check_violation then null;
  end;

  -- 3. One at a time per entry; never twice from the same form.
  v2 := pg_temp.submit(c3, 'spelling_variant', 'dictionary', 'word', 'hwtesta', '{"form":"hwtestc","kind":"spelling"}');
  perform pg_temp.review(b2, v2, 'accept');
  r := pg_temp.review(a1, v2, 'make_headword', base);
  assert r->>'error' = 'headword_open', 'second open headword change on the entry: ' || r::text;
  r := pg_temp.review(a1, v, 'make_headword', base);
  assert r->>'error' = 'headword_open', 'same form made headword twice: ' || r::text;

  -- 4. Only revert and an unchanged retry, by an admin.
  r := pg_temp.review(b2, hc, 'revert');
  assert r->>'error' = 'forbidden', 'reviewer acted on a headword change: ' || r::text;
  r := pg_temp.review(a1, hc, 'accept');
  assert r->>'error' = 'not_acceptable', 'headword change accepted: ' || r::text;
  r := pg_temp.review(a1, hc, 'retry_fold', '{"base":{"value":{"id":"x"}}}');
  assert r->>'error' = 'not_acceptable', 'retry rewrote the base: ' || r::text;
  r := pg_temp.review(a1, hc, 'retry_fold', '{"final_payload":{"form":"zzz","variant":"x"}}');
  assert r->>'error' = 'not_acceptable', 'retry rewrote the form: ' || r::text;

  -- 5. The form can't be undone while it is the headword.
  r := pg_temp.review(a1, v, 'revert');
  assert r->>'error' = 'has_dependants', 'promoted form reverted: ' || r::text;

  -- 6. Fold-in: the entry's other rows wait while the headword change is between claim and confirm.
  claim := public.fold_claim(tok);
  nonce := (claim->>'nonce')::uuid;
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = hc), 'headword change not claimed';
  -- (the example was claimed in the same run, before the headword change was folding)
  n := public.fold_mark(tok, nonce, array[ex], 'release');
  assert not exists (select 1 from jsonb_array_elements(public.fold_claim(tok)->'rows') e where (e->>'id')::uuid = ex),
    'a row on the entry was claimed while its headword change folds';
  r := pg_temp.review(a1, hc, 'revert');
  assert r->>'error' = 'folding', 'headword change reverted while folding: ' || r::text;

  -- 7. The new id is written back only within limits, then the entry's rows follow it at confirm.
  n := public.fold_mark(tok, nonce, array[hc], 'in_preview', 1, null, null, jsonb_build_object(hc::text, 'evil'));
  assert (select target_path from public.contributions where id = hc) is null, 'a new id unrelated to the form was stored';
  update public.contributions set fold_status = 'folding' where id = hc;
  n := public.fold_mark(tok, nonce, array[hc], 'in_preview', 1, null, null, jsonb_build_object(hc::text, 'hwtestb.2'));
  assert (select target_path from public.contributions where id = hc) = 'hwtestb.2', 'new id not written back';
  n := public.fold_mark(tok, null, array[hc], 'folded', null, 'sha1');
  assert (select target_id from public.contributions where id = hc) = 'hwtestb.2', 'headword change did not follow';
  assert (select target_id from public.contributions where id = v) = 'hwtestb.2', 'the form did not follow the entry';
  assert (select target_id from public.contributions where id = ex) = 'hwtestb.2', 'a waiting change did not follow the entry';
  assert not exists (select 1 from public.contributions where target_type = 'word' and target_id = 'hwtesta'), 'rows left on the old id';

  -- 8. A later headword change on the entry blocks undoing the earlier one; undo moves the rows back.
  update public.contributions set reviewed_at = now() - interval '1 hour' where id = hc;
  r := pg_temp.review(a1, v2, 'make_headword', '{"base":{"value":{"headword":"hwtestb","id":"hwtestb.2","homonym_index":2,"sort_key":"hwtestb","file":"h","after":null}}}');
  assert (r->>'ok')::boolean, 'chained make_headword failed: ' || r::text;
  hc2 := (r->>'id')::uuid;
  r := pg_temp.review(a1, hc, 'revert');
  assert r->>'error' = 'has_dependants', 'earlier headword change undone first: ' || r::text;
  delete from public.contributions where id = hc2;
  r := pg_temp.review(a1, hc, 'revert');
  assert r->>'live_status' = 'reverting', 'headword change not reverting: ' || r::text;
  claim := public.fold_claim(tok);
  nonce := (claim->>'nonce')::uuid;
  n := public.fold_mark(tok, nonce, array[hc], 'in_preview', 2);
  n := public.fold_mark(tok, null, array[hc], 'reverted', null, 'sha2');
  assert (select status from public.contributions where id = hc) = 'reverted', 'headword change not reverted';
  assert (select target_id from public.contributions where id = ex) = 'hwtesta', 'rows did not go back to the old id';
  assert (select target_id from public.contributions where id = v) = 'hwtesta', 'the form did not go back';
  r := pg_temp.review(a1, v, 'revert');
  assert not r ? 'error', 'the form still blocked after its headword change was undone: ' || r::text;
end $$;
