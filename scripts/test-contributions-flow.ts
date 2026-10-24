/**
 * End-to-end API test for community contributions (spec 34 technical §11), run against a local
 * production build that talks to the production database:
 *
 *   npm run build && npx next start -p 3123 &
 *   npm run test:flow                       # BASE_URL defaults to http://localhost:3123
 *
 * Safety: users are throwaway (test+contrib-<run>@chidigo.invalid, app_metadata.test = true), so every
 * row they create is flagged is_test and only ever targets the fixture plant `__test__`, which no page
 * reads; fold-in, credits and the digest ignore test rows. A finally-block removes the users and all
 * test data; a sweeper at the start removes anything an earlier run left behind.
 */
import { readFileSync, existsSync } from 'fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

function loadEnv() {
  if (!existsSync('.env.local')) return;
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}
loadEnv();

const BASE = process.env.BASE_URL ?? 'http://localhost:3123';
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST = '__test__';
const RUN = Date.now().toString(36);

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

let failures = 0;
let passes = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passes++;
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail !== undefined ? ` — ${JSON.stringify(detail).slice(0, 400)}` : ''}`);
  }
}

interface Session { id: string; email: string; cookie: string }

/** A signed-in session as the browser would hold it: @supabase/ssr cookies from a magic-link login. */
async function session(email: string): Promise<Session> {
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !link.properties?.hashed_token) throw new Error(`generateLink: ${error?.message}`);
  const jar = new Map<string, string>();
  const ssr = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { data, error: otpError } = await ssr.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' });
  if (otpError || !data.user) throw new Error(`verifyOtp: ${otpError?.message}`);
  return { id: data.user.id, email, cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') };
}

async function call(s: Session | null, method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...(s && { cookie: s.cookie }), ...(body !== undefined && { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

async function createUser(label: string) {
  const email = `test+contrib-${RUN}-${label}@chidigo.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { test: true },
    user_metadata: { full_name: `Test ${label}` },
  });
  if (error || !data.user) throw new Error(`createUser ${label}: ${error?.message}`);
  return email;
}

async function sweep(db: SupabaseClient) {
  const cutoff = Date.now() - 60 * 60 * 1000;
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (u.email?.startsWith('test+contrib-') && u.app_metadata?.test === true && new Date(u.created_at).getTime() < cutoff) {
      await db.auth.admin.deleteUser(u.id);
    }
  }
}

const plantName = (name: string) => ({
  type: 'plant_name', target_type: 'plant', target_id: TEST, payload: { name, choice: 'other' },
  locale: 'en', region: 'kinondo_diani', confidence: 'native',
});

async function main() {
  console.log(`contributions flow test against ${BASE} (run ${RUN})`);
  await sweep(admin);
  await admin.rpc('cleanup_test_data');

  const users: string[] = [];
  try {
    const emails = { c: await createUser('contributor'), d: await createUser('second'), a: await createUser('admin'), r: await createUser('reviewer') };
    const C = await session(emails.c);
    const D = await session(emails.d);
    const A = await session(emails.a);
    const R = await session(emails.r);
    users.push(C.id, D.id, A.id, R.id);
    await admin.from('profiles').update({ role: 'admin' }).eq('id', A.id);

    console.log('1. submission validation');
    check('signed out → 401', (await call(null, 'POST', '/api/contributions', plantName('x'))).status === 401);
    let r = await call(C, 'POST', '/api/contributions', { ...plantName('<b>x</b>') });
    check('markup → 400', r.status === 400, r);
    r = await call(C, 'POST', '/api/contributions', { type: 'plant_addition', payload: { english: 'Wild yam', description: 'A climbing plant' }, locale: 'en' });
    check('type not enabled yet → 400', r.status === 400 && r.json.error === 'type_not_enabled', r);
    r = await call(C, 'POST', '/api/contributions', { ...plantName('x'), target_id: 'no-such-plant-xyz' });
    check('test account on any other target → 403', r.status === 403 && r.json.error === 'test_account_target', r);

    console.log('2. submit, held, public panel');
    r = await call(C, 'POST', '/api/contributions', plantName('jina-a'));
    check('submit → 201, held (new contributor)', r.status === 201 && r.json.held === true, r);
    const first = r.json.id as string;
    r = await call(null, 'GET', `/api/contributions/public?target_type=plant&target_id=${TEST}`);
    check('held suggestion is not public', r.status === 200 && !r.json.some((x: { id: string }) => x.id === first), r);

    console.log('3. review, accept, overlay');
    // Test rows go live even while publishing is paused (they only ever touch the fixture plant), so
    // this test never changes the global switch. Pausing itself is covered by the database tests.
    r = await call(C, 'POST', `/api/review/${first}`, { action: 'accept' });
    check('member cannot review → 403', r.status === 403, r);
    r = await call(A, 'POST', `/api/review/${first}`, { action: 'accept' });
    check('admin accepts → live', r.status === 200 && r.json.live_status === 'live', r);
    let overlay = await call(null, 'GET', '/api/overlay/plant');
    const inOverlay = (id: string) => overlay.json.changes.some((c: { contribution_id: string }) => c.contribution_id === id);
    check('accepted change is in the overlay', inOverlay(first), overlay.json);
    const change = overlay.json.changes.find((c: { contribution_id: string }) => c.contribution_id === first);
    check('overlay carries no user data', !!change && !('user_id' in change) && change.target_id === TEST, change);

    console.log('4. after first accept: not held, agree, report');
    r = await call(C, 'POST', '/api/contributions', {
      type: 'plant_info', target_type: 'plant', target_id: TEST, locale: 'en', region: 'tanga', confidence: 'heard',
      payload: { section: 'uses', lang: 'en', mode: 'add', text: 'Used for testing.' },
    });
    check('second suggestion is not held', r.status === 201 && r.json.held === false, r);
    const info = r.json.id as string;
    r = await call(null, 'GET', `/api/contributions/public?target_type=plant&target_id=${TEST}`);
    const pub = r.json.find((x: { id: string }) => x.id === info);
    check('public panel shows it, region only', !!pub && pub.region === 'tanga' && !('user_id' in pub) && !('village' in pub), r.json);
    r = await call(C, 'POST', `/api/contributions/${info}/agree`, {});
    check('cannot agree with own → 403', r.status === 403 && r.json.error === 'own', r);
    r = await call(D, 'POST', `/api/contributions/${info}/agree`, { region: 'kwale_south', confidence: 'native' });
    check('agree (new account: recorded, not counted)', r.status === 200 && r.json.agree_count === 0, r);
    r = await call(D, 'GET', `/api/contributions/public/mine?ids=${info}`);
    check('caller sees own agreement flag', r.status === 200 && r.json.agreed.includes(info), r);
    r = await call(D, 'POST', `/api/contributions/${info}/report`, { reason: 'spam' });
    check('report', r.status === 200, r);
    r = await call(C, 'POST', '/api/contributions', plantName('jina-z'));
    check('a public plant-name suggestion', r.status === 201 && r.json.held === false, r);
    r = await call(D, 'POST', '/api/contributions', plantName("Jina-Z"));
    check('a similar name asks "is it the same?" instead of filing', r.status === 200 && r.json.inserted === false && r.json.similar?.name === 'jina-z', r);
    r = await call(D, 'POST', '/api/contributions', { ...plantName('Jina-Z'), force_new: true });
    check('…and can still be filed as its own suggestion', r.status === 201, r);
    r = await call(D, 'POST', '/api/contributions', { ...plantName('x'), target_id: 'mnazi' });
    check('test accounts can only touch the fixture plant → 403', r.status === 403, r);

    console.log('5. self-review, Digo rules, conflicts');
    r = await call(A, 'POST', '/api/contributions', plantName('jina-admin'));
    const adminOwn = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${adminOwn}`, { action: 'accept' });
    check('admin cannot accept own → 403 self_review', r.status === 403 && r.json.error === 'self_review', r);
    r = await call(C, 'POST', '/api/contributions', {
      type: 'plant_info', target_type: 'plant', target_id: TEST, locale: 'dg', region: 'kinondo_diani', confidence: 'native',
      payload: { section: 'uses', lang: 'dg', mode: 'add', text: 'Ni chichaka' },
    });
    const ruled = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${ruled}`, { action: 'accept' });
    check('ruled-out Digo blocks accept → 422', r.status === 422 && r.json.error === 'ruled_out', r);
    r = await call(A, 'POST', `/api/review/${ruled}`, {
      action: 'accept', final_payload: { section: 'uses', lang: 'dg', mode: 'add', text: 'Ni chitsaka' },
    });
    check('accept after the reviewer fixes it', r.status === 200, r);
    r = await call(D, 'POST', '/api/contributions', plantName('jina-b'));
    const stale = r.json.id as string;
    // `first` already replaced the headword; D's suggestion was made after that, so it is current.
    // Revert `first` underneath it, then the base no longer matches.
    r = await call(A, 'POST', `/api/review/${first}`, { action: 'revert' });
    check('revert an unfolded change', r.status === 200 && r.json.status === 'reverted', r);
    overlay = await call(null, 'GET', '/api/overlay/plant');
    check('reverted change left the overlay', !inOverlay(first));
    r = await call(A, 'POST', `/api/review/${stale}`, { action: 'accept' });
    check('target changed since suggested → 409', r.status === 409 && r.json.error === 'target_changed', r);

    console.log('5b. reviewers, second review, notifications');
    r = await call(A, 'POST', '/api/admin/reviewers', { action: 'grant', user_id: R.id, scopes: ['plants'] });
    check('admin makes a plants reviewer', r.status === 200 && r.json.role === 'reviewer', r);
    r = await call(R, 'GET', '/api/contributions/me');
    check('…who sees their role and scope', r.json.role === 'reviewer' && r.json.scopes.includes('plants') && typeof r.json.review_pending === 'number', r);
    r = await call(R, 'GET', '/api/review/queue?view=open');
    check('…and only plants items in the queue', r.status === 200 && r.json.groups.every((g: { items: { scope: string }[] }) => g.items.every((i) => i.scope === 'plants')), r);
    r = await call(R, 'GET', '/api/admin/reviewers');
    check('reviewers cannot open admin → 403', r.status === 403, r);
    r = await call(C, 'POST', '/api/contributions', {
      type: 'plant_info', target_type: 'plant', target_id: TEST, locale: 'en', region: 'tanga', confidence: 'native',
      payload: { section: 'uses', lang: 'en', mode: 'replace', text: 'Long replacement. '.repeat(20) },
    });
    const long = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${long}`, { action: 'accept' });
    check('a large replacement waits for a second reviewer', r.status === 200 && r.json.live_status === 'awaiting_second', r);
    r = await call(R, 'GET', '/api/notifications');
    check('…who is notified', r.status === 200 && r.json.some((n: { kind: string; contribution_id: string }) => n.kind === 'second_review' && n.contribution_id === long), r);
    r = await call(A, 'POST', `/api/review/${long}`, { action: 'second_confirm' });
    check('the first reviewer cannot confirm their own accept → 409', r.status === 409, r);
    r = await call(R, 'POST', `/api/review/${long}`, { action: 'second_confirm' });
    check('the second reviewer confirms → live', r.status === 200 && r.json.live_status === 'live', r);
    r = await call(C, 'GET', '/api/notifications');
    const mine = r.json.find((n: { kind: string; contribution_id: string }) => n.kind === 'accepted' && n.contribution_id === long);
    check('the contributor is notified, with a summary and no reviewer identity', !!mine && mine.contribution?.summary?.startsWith('Long replacement') && !JSON.stringify(mine).includes(R.id), mine);
    r = await call(C, 'POST', '/api/notifications', { all: true });
    r = await call(C, 'GET', '/api/contributions/me');
    check('reading clears the unread count', r.json.unread === 0, r.json.unread);
    r = await call(A, 'POST', '/api/admin/reviewers', { action: 'remove', user_id: R.id });
    check('admin removes the reviewer', r.status === 200 && r.json.role === 'member', r);
    r = await call(R, 'GET', '/api/review/queue');
    check('…who loses the queue at once → 403', r.status === 403, r);
    // With no other reviewer left, the admin may confirm their own accept (owner decision 2026-10-16).
    r = await call(D, 'POST', '/api/contributions', {
      type: 'plant_info', target_type: 'plant', target_id: TEST, locale: 'en', region: 'tanga', confidence: 'native',
      payload: { section: 'uses', lang: 'en', mode: 'replace', text: 'Second long replacement. '.repeat(16) },
    });
    const solo = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${solo}`, { action: 'accept' });
    check('large replacement waits for a second reviewer', r.json.live_status === 'awaiting_second', r);
    r = await call(A, 'GET', `/api/review/${solo}`);
    check('…and the lone admin is offered self-confirm', r.json.can_self_confirm === true, r.json.can_self_confirm);
    r = await call(A, 'POST', `/api/review/${solo}`, { action: 'self_confirm' });
    check('…which takes it live, logged as single-reviewed', r.status === 200 && r.json.live_status === 'live', r);

    console.log('5c. dictionary (spec 34 §15.3)');
    const W1 = await session(await createUser('words1'));
    const W2 = await session(await createUser('words2'));
    users.push(W1.id, W2.id);
    const word = (type: string, payload: Record<string, unknown>, target_id: string | undefined = TEST) => ({
      type, ...(target_id !== undefined && { target_id }), payload, locale: 'en', region: 'tanga', confidence: 'native',
    });
    r = await call(W2, 'POST', '/api/contributions', word('word_addition', { headword: 'кaya', meaning_en: 'x' }, undefined));
    check('a Cyrillic look-alike headword → 400', r.status === 400, r);
    r = await call(W2, 'POST', '/api/contributions', word('word_addition', { headword: 'ka\u200bya', meaning_en: 'x' }, undefined));
    check('a zero-width character → 400', r.status === 400, r);
    r = await call(W2, 'POST', '/api/contributions', word('example_sentence', { sense_id: '1', dg: 'x' }, '../mama'));
    check('a path as the target → 400', r.status === 400 && r.json.error === 'invalid_target', r);
    r = await call(W2, 'POST', '/api/contributions', word('example_sentence', { sense_id: '../1', dg: 'x' }));
    check('a non-numeric sense id → 400', r.status === 400, r);
    r = await call(W2, 'POST', '/api/contributions', word('word_addition', { headword: 'kaya', meaning_en: 'x' }, undefined));
    check('test accounts add only the test word → 403', r.status === 403 && r.json.error === 'test_account_target', r);

    r = await call(W1, 'POST', '/api/contributions', word('example_sentence', { sense_id: '1', dg: 'Ni majaribio.', en: 'It is a test.' }));
    check('example on the fixture word → 201', r.status === 201, r);
    const ex = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${ex}`, { action: 'accept' });
    check('…accepted and live', r.status === 200 && r.json.live_status === 'live', r);
    let words = await call(null, 'GET', '/api/overlay/word');
    check('…in the word overlay', words.json.changes.some((c: { contribution_id: string }) => c.contribution_id === ex), words.json);

    r = await call(W1, 'POST', '/api/contributions', word('entry_flag', { reason: 'offensive', detail: 'private detail' }));
    check('flag → 201', r.status === 201, r);
    const flag = r.json.id as string;
    r = await call(null, 'GET', `/api/contributions/public?target_type=word&target_id=${TEST}`);
    check('…never on the public panel', r.status === 200 && !r.json.some((x: { id: string }) => x.id === flag), r);
    r = await call(A, 'POST', `/api/review/${flag}`, { action: 'accept' });
    check('…cannot be accepted → 400', r.status === 400 && r.json.error === 'not_acceptable', r);
    r = await call(A, 'POST', `/api/review/${flag}`, { action: 'resolve', note: 'Checked: fine.' });
    check('…is resolved instead', r.status === 200 && r.json.status === 'resolved', r);
    words = await call(null, 'GET', '/api/overlay/word');
    check('…and never reaches the overlay', !JSON.stringify(words.json).includes(flag) && !JSON.stringify(words.json).includes('private detail'), words.json);

    r = await call(W1, 'POST', '/api/contributions', word('definition_update', { sense_id: '1', lang: 'en', text: 'another test meaning', mode: 'add_sense', reason: 'secret reason' }));
    const addSense = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${addSense}`, {
      action: 'accept', final_payload: { sense_id: '1', lang: 'en', text: 'another test meaning', mode: 'replace' },
    });
    check('a reviewer cannot turn a new meaning into a replace → 400', r.status === 400 && r.json.error === 'locked_fields', r);
    r = await call(A, 'POST', `/api/review/${addSense}`, { action: 'accept' });
    const { data: sensed } = await admin.from('contributions').select('target_path').eq('id', addSense).single();
    check('a new meaning gets its sense id at accept', r.status === 200 && sensed?.target_path === 'senses.2', sensed);
    words = await call(null, 'GET', '/api/overlay/word');
    const ov = words.json.changes.find((c: { contribution_id: string }) => c.contribution_id === addSense);
    check('…and its reason stays on the server', !!ov && ov.target_path === 'senses.2' && !('reason' in ov.final_payload), ov);

    r = await call(W1, 'POST', '/api/contributions', word('definition_update', { sense_id: '1', lang: 'dg', text: 'Majaribio mapya', mode: 'replace' }));
    const replace = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${replace}`, { action: 'accept' });
    check('a Digo definition replace goes live', r.status === 200 && r.json.live_status === 'live', r);

    words = await call(null, 'GET', '/api/overlay/word');
    check('…in the overlay', words.json.changes.some((c: { contribution_id: string }) => c.contribution_id === replace), words.json);
    r = await call(W1, 'POST', '/api/contributions', word('word_addition', { headword: TEST, meaning_en: 'test word' }, undefined));
    check('the test new word → 201', r.status === 201, r);
    const newWord = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${newWord}`, { action: 'accept' });
    check('…accepted and live', r.status === 200 && r.json.live_status === 'live', r);

    r = await call(W2, 'POST', '/api/contributions', word('spelling_variant', { form: 'majaribiyo', kind: 'dialect' }));
    check('a regional form → 201', r.status === 201, r);
    const variant = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${variant}`, { action: 'accept' });
    check('…accepted', r.status === 200 && r.json.live_status === 'live', r);
    words = await call(null, 'GET', '/api/overlay/word');
    check('new word and regional form are in the overlay', [newWord, variant].every((id) => words.json.changes.some((c: { contribution_id: string }) => c.contribution_id === id)), words.json);
    r = await call(A, 'POST', `/api/review/${flag}`, { action: 'resolve' });
    check('resolve needs a note → 400', r.status === 400, r);

    console.log('5d. proverbs (spec 34 §16)');
    const P1 = await session(await createUser('proverbs1'));
    const P2 = await session(await createUser('proverbs2'));
    users.push(P1.id, P2.id);
    const pv = (type: string, payload: Record<string, unknown>, target_id: string | undefined = TEST) => ({
      type, ...(target_id !== undefined && { target_id }), payload, locale: 'en', region: 'tanga', confidence: 'native',
    });
    r = await call(P2, 'POST', '/api/contributions', pv('proverb_variant', { form: 'Mvula1' }));
    check('digits in a proverb → 400', r.status === 400, r);
    r = await call(P2, 'POST', '/api/contributions', pv('proverb_context', { lang: 'en', text: 'a\u200bb' }));
    check('a zero-width character → 400', r.status === 400, r);
    r = await call(P2, 'POST', '/api/contributions', pv('proverb_variant', { form: 'Mvula' }, '../p-001'));
    check('a path as the target → 400', r.status === 400 && r.json.error === 'invalid_target', r);
    r = await call(P2, 'POST', '/api/contributions', pv('proverb_addition', { digo: 'Mvula ya kare', meaning_en: 'x' }, undefined));
    check('test accounts add only the test proverb → 403', r.status === 403 && r.json.error === 'test_account_target', r);

    r = await call(P1, 'POST', '/api/contributions', pv('proverb_meaning', { lang: 'en', kind: 'idiomatic', mode: 'replace', text: 'Tests matter' }));
    const pm = r.json.id as string;
    // A second meaning made against the same text goes stale once the first is accepted.
    r = await call(P2, 'POST', '/api/contributions', pv('proverb_meaning', { lang: 'en', kind: 'idiomatic', mode: 'replace', text: 'Tests are good' }));
    const pmStale = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${pm}`, { action: 'accept', final_payload: { lang: 'sw', kind: 'idiomatic', mode: 'replace', text: 'x' } });
    check('a reviewer cannot change the language → 400', r.status === 400 && r.json.error === 'locked_fields', r);
    r = await call(A, 'POST', `/api/review/${pm}`, { action: 'accept' });
    check('a meaning on the fixture proverb goes live', r.status === 200 && r.json.live_status === 'live', r);
    r = await call(A, 'POST', `/api/review/${pmStale}`, { action: 'accept' });
    check('a meaning made against older text → 409', r.status === 409 && r.json.error === 'target_changed', r);
    r = await call(P1, 'POST', '/api/contributions', pv('proverb_context', { lang: 'en', text: 'Call me on +254 712 345 678 for the story.' }));
    const pc = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${pc}`, { action: 'accept' });
    check('personal details block an accept → 422', r.status === 422 && r.json.error === 'pii', r);
    r = await call(A, 'POST', `/api/review/${pc}`, { action: 'accept', final_payload: { lang: 'en', text: 'Told by grandmothers.' } });
    check('…accepted once removed', r.status === 200, r);
    r = await call(P1, 'POST', '/api/contributions', pv('proverb_addition', { digo: TEST, meaning_en: 'a test proverb', themes: ['food'], mature: false }, undefined));
    const pa = r.json.id as string;
    check('the test new proverb → 201', r.status === 201, r);
    const { data: paSent } = await admin.from('contributions').select('payload').eq('id', pa).single();
    check('…without the contributor’s themes (the reviewer sets them)', !!paSent && !('themes' in paSent.payload), paSent);
    r = await call(A, 'POST', `/api/review/${pa}`, { action: 'accept' });
    check('…accept without the mature decision → 422', r.status === 422 && r.json.error === 'mature_required', r);
    r = await call(A, 'POST', `/api/review/${pa}`, { action: 'accept', final_payload: { digo: TEST, meaning_en: 'a test proverb', mature: false, themes: ['wisdom'] } });
    check('…accepted with the reviewer’s completion', r.status === 200, r);
    const { data: paRow } = await admin.from('contributions').select('target_id').eq('id', pa).single();
    check('…a test proverb keeps its fixture target (no id reserved)', paRow?.target_id === TEST, paRow);
    r = await call(P2, 'POST', '/api/contributions', pv('proverb_variant', { form: 'Methali ya majaribiyo' }));
    const pvar = r.json.id as string;
    r = await call(A, 'POST', `/api/review/${pvar}`, { action: 'accept' });
    const proverbsOv = await call(null, 'GET', '/api/overlay/proverb');
    check('proverb changes are in the overlay', [pm, pc, pa, pvar].every((id) => proverbsOv.json.changes.some((c: { contribution_id: string }) => c.contribution_id === id)), proverbsOv.json);
    const ovText = JSON.stringify(proverbsOv.json);
    check('…with no user data or the removed personal details', !/user_id|reviewer_id|review_note|345 678/.test(ovText) && !ovText.includes(P1.id), ovText.slice(0, 300));

    console.log('5e. translation fixes (spec 34 §17)');
    const T1 = await session(await createUser('translations1'));
    users.push(T1.id);
    const tf = (target_type: string, payload: Record<string, unknown>) => ({
      type: 'translation_fix', target_type, target_id: TEST, payload: { reason: 'Better wording', ...payload }, locale: 'sw', region: 'tanga', confidence: 'native',
    });
    r = await call(T1, 'POST', '/api/contributions', tf('plant', { lang: 'sw', field: 'teaser', proposed: 'Jaribio' }));
    check('an unchanged text → 400', r.status === 400 && r.json.error === 'unchanged', r);
    r = await call(T1, 'POST', '/api/contributions', tf('plant', { lang: 'en', field: 'teaser', proposed: 'Changed' }));
    check('English on a plant → 404 (not fixable)', r.status === 404, r);
    r = await call(T1, 'POST', '/api/contributions', tf('plant', { lang: 'sw', field: 'teaser', proposed: 'Jaribio *jipya*' }));
    check('added markup → 400', r.status === 400 && r.json.error === 'markup', r);
    r = await call(T1, 'POST', '/api/contributions', { ...tf('plant', { lang: 'sw', field: 'teaser', proposed: 'x' }), payload: { lang: 'sw', field: 'teaser', proposed: 'x' } });
    check('no reason → 400', r.status === 400, r);
    r = await call(T1, 'POST', '/api/contributions', tf('plant', { lang: 'sw', field: 'teaser', proposed: 'Jaribio jipya kabisa' }));
    const tPlant = r.json.id as string;
    check('a Swahili teaser fix → 201', r.status === 201, r);
    r = await call(T1, 'POST', '/api/contributions', tf('glossary', { lang: 'dg', field: 'definition', proposed: 'Neno ra kujeza.' }));
    const tGloss = r.json.id as string;
    check('a Digo glossary fix → 201', r.status === 201, r);
    r = await call(T1, 'POST', '/api/contributions', tf('proverb', { lang: 'en', field: 'commentary', proposed: 'Used in tests, always.' }));
    const tEn = r.json.id as string;
    const { data: tEnRow } = await admin.from('contributions').select('scope, target_path').eq('id', tEn).single();
    check('a proverb fix goes to the proverbs reviewers, path built on the server', tEnRow?.scope === 'proverbs' && tEnRow?.target_path === 'commentary_en', tEnRow);

    // Reviewer languages: the translations scope alone doesn't open a Digo fix.
    r = await call(A, 'POST', '/api/admin/reviewers', { action: 'grant', user_id: R.id, scopes: ['plants', 'translations'], languages: [] });
    r = await call(R, 'GET', `/api/review/${tGloss}`);
    check('a reviewer who doesn’t read Digo can’t open a Digo fix → 403', r.status === 403, r.status);
    r = await call(A, 'POST', '/api/admin/reviewers', { action: 'grant', user_id: R.id, scopes: ['plants', 'translations'], languages: ['dg'] });
    r = await call(R, 'GET', `/api/review/${tGloss}`);
    check('…once marked as reading Digo, they can', r.status === 200 && r.json.current?.source === 'A test term.', r.status);

    r = await call(A, 'POST', `/api/review/${tPlant}`, { action: 'accept', final_payload: { lang: 'sw', field: 'teaser', proposed: 'Piga +254 712 345 678', reason: 'x' } });
    check('personal details block a fix → 422', r.status === 422 && r.json.error === 'pii', r);
    r = await call(A, 'POST', `/api/review/${tPlant}`, { action: 'accept' });
    check('the teaser fix goes live', r.status === 200 && r.json.live_status === 'live', r);
    r = await call(R, 'POST', `/api/review/${tGloss}`, { action: 'accept' });
    check('the Digo reader accepts the glossary fix', r.status === 200, r);
    r = await call(A, 'POST', `/api/review/${tEn}`, { action: 'accept' });
    check('an English change needs a second reviewer', r.status === 200 && r.json.live_status === 'awaiting_second', r);
    const plantOv = await call(null, 'GET', '/api/overlay/plant');
    const ovFixes = plantOv.json.changes.filter((c: { type: string }) => c.type === 'translation_fix');
    check('fixes are in the overlay with their target type', [tPlant, tGloss].every((id) => ovFixes.some((c: { contribution_id: string; target_type: string }) => c.contribution_id === id && c.target_type)), ovFixes);
    check('…and no reason', !JSON.stringify(ovFixes).includes('Better wording'), ovFixes);

    console.log('6. member actions, limits, privacy');
    r = await call(C, 'PATCH', `/api/contributions/${info}`, { action: 'withdraw' });
    check('withdraw', r.status === 200 && r.json.status === 'withdrawn', r);
    r = await call(C, 'PATCH', `/api/contributions/${info}`, { action: 'withdraw' });
    check('withdraw twice → 409', r.status === 409, r);
    r = await call(C, 'GET', '/api/contributions?mine=1');
    check('my contributions, without reviewer ids', r.status === 200 && r.json.length >= 3 && r.json.every((x: object) => !('reviewer_id' in x)), r);
    r = await call(D, 'PATCH', `/api/contributions/${ruled}`, { action: 'withdraw' });
    check('cannot withdraw someone else\'s → 404', r.status === 404, r);
    r = await call(C, 'GET', '/api/contributions/me');
    check('me: role and unread count', r.status === 200 && r.json.role === 'member' && typeof r.json.unread === 'number', r);
    r = await call(null, 'GET', `/api/credits?ids=${ruled}`);
    check('credits: no name without consent', r.status === 200 && r.json.length === 1 && r.json[0].credited === false && r.json[0].first_name === null, r);
    r = await call(C, 'GET', '/api/export');
    check('export includes contributions', r.status === 200 && Array.isArray(r.json.contributions) && r.json.contributions.length >= 3, r.status);
    let limited = false;
    for (let i = 0; i < 6 && !limited; i++) {
      r = await call(C, 'POST', '/api/contributions', { type: 'general_feedback', target_type: 'page', target_id: '/test', payload: { text: `feedback ${i}` }, locale: 'en' });
      limited = r.status === 429 && r.json.error === 'limit_day';
    }
    check('new-account daily limit → 429', limited, r);

    console.log('7. admin');
    r = await call(D, 'GET', '/api/admin/reviewers');
    check('member cannot open admin → 403', r.status === 403, r);
    r = await call(A, 'GET', '/api/admin/settings');
    check('admin settings', r.status === 200 && typeof r.json.publishing_paused === 'boolean', r);
    r = await call(A, 'POST', `/api/admin/users/${D.id}/block`, { blocked: true });
    check('block declines open suggestions', r.status === 200 && r.json.declined >= 1, r);
    r = await call(D, 'POST', '/api/contributions', plantName('jina-c'));
    check('blocked user cannot submit → 403', r.status === 403 && r.json.error === 'blocked', r);

    console.log('8. account deletion');
    r = await call(C, 'DELETE', '/api/account');
    check('account deletion', r.status === 200, r);
    const { data: open } = await admin.from('contributions').select('id').eq('user_id', C.id).in('status', ['pending', 'needs_info']);
    check('…withdraws the open suggestions', (open ?? []).length === 0, open);
    r = await call(C, 'GET', '/api/contributions?mine=1');
    check('…and signs the user out everywhere', r.status === 401, r.status);
  } finally {
    const { data: cleaned } = await admin.rpc('cleanup_test_data');
    for (const id of users) await admin.auth.admin.deleteUser(id);
    console.log(`cleanup: ${JSON.stringify(cleaned)}, ${users.length} users removed`);
  }

  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
