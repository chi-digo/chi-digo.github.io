#!/usr/bin/env node
/**
 * Fold-in's only door into the database (spec 34 technical §2.1, §6): the token-guarded functions
 * fold_claim and fold_mark, called with the public anon key plus FOLD_TOKEN. The token can claim rows
 * and move its own claims through the legal states; it can't read people or change content.
 *
 *   node rpc.mjs claim > claimed.json
 *   node rpc.mjs in_preview > rows.json                       (read-only, for fold-confirm)
 *   node rpc.mjs mark <state> <nonce|-> <ids,comma> [pr] [sha] [error]
 */
const [, , cmd, ...rest] = process.argv;
const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const token = process.env.FOLD_TOKEN;
if (!url || !anon || !token) {
  console.error('SUPABASE_URL, SUPABASE_ANON_KEY and FOLD_TOKEN are required');
  process.exit(2);
}

async function call(fn, body) {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`${fn}: ${res.status} ${text.slice(0, 300)}`);
    process.exit(1);
  }
  return JSON.parse(text);
}

if (cmd === 'claim' || cmd === 'in_preview') {
  const out = await call('fold_claim', { p_token: token, p_mode: cmd });
  process.stdout.write(JSON.stringify(out));
} else if (cmd === 'mark') {
  const [state, nonce, ids, pr, sha, error] = rest;
  const n = await call('fold_mark', {
    p_token: token,
    p_nonce: nonce && nonce !== '-' ? nonce : null,
    p_ids: ids ? ids.split(',').filter(Boolean) : [],
    p_state: state,
    p_pr: pr && pr !== '-' ? Number(pr) : null,
    p_sha: sha && sha !== '-' ? sha : null,
    p_error: error ?? null,
  });
  console.log(`${state}: ${n}`);
} else {
  console.error('usage: rpc.mjs claim | in_preview | mark <state> <nonce> <ids> [pr] [sha] [error]');
  process.exit(2);
}
