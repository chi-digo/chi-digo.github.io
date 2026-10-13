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
    const emails = { c: await createUser('contributor'), d: await createUser('second'), a: await createUser('admin') };
    const C = await session(emails.c);
    const D = await session(emails.d);
    const A = await session(emails.a);
    users.push(C.id, D.id, A.id);
    await admin.from('profiles').update({ role: 'admin' }).eq('id', A.id);

    console.log('1. submission validation');
    check('signed out → 401', (await call(null, 'POST', '/api/contributions', plantName('x'))).status === 401);
    let r = await call(C, 'POST', '/api/contributions', { ...plantName('<b>x</b>') });
    check('markup → 400', r.status === 400, r);
    r = await call(C, 'POST', '/api/contributions', { type: 'word_addition', payload: { headword: 'x', meaning_en: 'y' }, locale: 'en' });
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
    check('me: role and unread notifications', r.status === 200 && r.json.role === 'member' && r.json.unread >= 1, r);
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
