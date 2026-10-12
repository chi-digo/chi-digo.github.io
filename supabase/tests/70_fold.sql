-- Fold-in functions: token, nonce, legal transitions, revert path.
-- A random token per run, so nothing reusable could survive even outside the rolled-back batch.
create temp table t_token as select gen_random_uuid()::text || gen_random_uuid()::text as token;
insert into private.fold_tokens (token_hash) select encode(sha256(convert_to(token, 'UTF8')), 'hex') from t_token;

do $$
declare
  a1 uuid := '00000000-0000-4000-8000-0000000000a1';
  live_id uuid := (select id from t_ids where name = 'accepted_live');
  tok text := (select token from t_token);
  claim jsonb; nonce uuid; n int; r jsonb;
begin
  update public.app_settings set value = to_jsonb(now()::text) where key = 'fold_requested_at';
  assert public.fold_requested(), 'fold_requested false with work waiting';

  claim := public.fold_claim(tok);
  nonce := (claim->>'nonce')::uuid;
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = live_id), 'live change not claimed';
  assert not exists (select 1 from jsonb_array_elements(claim->'rows') e where e ? 'user_id'), 'claim leaks user ids';
  assert jsonb_array_length(public.fold_claim(tok)->'rows') = 0, 'claimed twice';

  n := public.fold_mark(tok, gen_random_uuid(), array[live_id], 'in_preview', 1);
  assert n = 0, 'wrong nonce accepted';
  n := public.fold_mark(tok, nonce, array[live_id], 'folded', null, 'abc');
  assert n = 0, 'skipped in_preview';
  n := public.fold_mark(tok, nonce, array[live_id], 'in_preview', 7);
  assert n = 1, 'in_preview failed';
  n := public.fold_mark(tok, null, array[live_id], 'folded', null, 'abc123');
  assert n = 1, 'folded failed';
  assert (select fold_status from public.contributions where id = live_id) = 'folded', 'not folded';

  -- Revert after fold-in: leaves the overlay (reverting), is claimed for unapply, released back to folded.
  r := pg_temp.review(a1, live_id, 'revert');
  assert r->>'live_status' = 'reverting', 'expected reverting: ' || r::text;
  claim := public.fold_claim(tok);
  assert exists (select 1 from jsonb_array_elements(claim->'rows') e where (e->>'id')::uuid = live_id), 'revert not claimed';
  n := public.fold_mark(tok, (claim->>'nonce')::uuid, array[live_id], 'release');
  assert (select fold_status from public.contributions where id = live_id) = 'folded', 'release lost the folded state';

  claim := public.fold_claim(tok);
  n := public.fold_mark(tok, (claim->>'nonce')::uuid, array[live_id], 'in_preview', 8);
  assert jsonb_array_length(public.fold_claim(tok)->'rows') = 0, 'in_preview revert reclaimed';
  n := public.fold_mark(tok, null, array[live_id], 'reverted', null, 'def456');
  assert (select status from public.contributions where id = live_id) = 'reverted', 'not reverted';
end $$;
