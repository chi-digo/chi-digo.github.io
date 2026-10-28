/**
 * Browser checks for the plants contribution UI (spec 34 technical §12.3), against a local production
 * build that uses the production database:
 *
 *   npm run build && npm run test:ui
 *
 * It writes the fixture plant, then starts `next start` itself (the server reads public/ at startup),
 * unless BASE_URL points at a server that already has the fixture.
 *
 * Uses Chrome through playwright-core (no browser download). Throwaway accounts are flagged as test
 * data and only touch the fixture plant `__test__`, whose JSON is written for the run and removed after.
 * Screenshots go to $UI_SHOTS (default /tmp/contrib-ui).
 */
import { readFileSync, existsSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { spawn, type ChildProcess } from 'child_process';
import { join } from 'path';
import { chromium, type BrowserContext, type Page } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { testPlant, testWord, testProverb } from '../lib/contributions/targets';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

const BASE = process.env.BASE_URL ?? 'http://localhost:3124';
const SHOTS = process.env.UI_SHOTS ?? '/tmp/contrib-ui';
const RUN = Date.now().toString(36);
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const FIXTURE = join(process.cwd(), 'public/data/plants/p/__test__.json');
const PLANT = '/culture/ecology/plants/__test__';
// The fixture word lives in its own letter file, `_`, which no real headword maps to.
const WORD_FILE = join(process.cwd(), 'public/data/_.json');
const WORD_IDX = join(process.cwd(), 'public/data/_.idx.json');
const WORD = '/language/dictionary/word/__test__';
// The fixture proverb is appended to the proverbs file for the run and the original restored after.
const PROVERBS = join(process.cwd(), 'public/data/proverbs/index.json');
let proverbsOriginal: string | null = null;
const PROVERB = '/language/proverbs/p-test';
const removeFixtures = () => {
  [FIXTURE, WORD_FILE, WORD_IDX].forEach((f) => rmSync(f, { force: true }));
  if (proverbsOriginal !== null) writeFileSync(PROVERBS, proverbsOriginal);
};

let passes = 0;
let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) passes++;
  else failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${!ok && detail !== undefined ? ` — ${String(detail).slice(0, 300)}` : ''}`);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: false });
}

async function user(label: string) {
  const email = `test+contrib-${RUN}-${label}@chidigo.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email, email_confirm: true, app_metadata: { test: true }, user_metadata: { full_name: `Tester ${label}` },
  });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const jar = new Map<string, string>();
  const ssr = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error: otpError } = await ssr.auth.verifyOtp({ token_hash: link.properties!.hashed_token, type: 'magiclink' });
  if (otpError) throw new Error(`verifyOtp: ${otpError.message}`);
  const cookies = [...jar].map(([name, value]) => ({ name, value, domain: 'localhost', path: '/' }));
  return { id: data.user.id, cookies };
}

async function signIn(ctx: BrowserContext, cookies: { name: string; value: string; domain: string; path: string }[]) {
  await ctx.addCookies(cookies);
}

// Generous: a local server calls Supabase over the open internet, and cold connections can take seconds.
async function visible(page: Page, text: string | RegExp, timeout = 20000) {
  try {
    await page.getByText(text).first().waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  // Leftovers from an interrupted run: test users older than 10 minutes and their data.
  const { data: old } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of old?.users ?? []) {
    if (u.email?.startsWith('test+contrib-') && u.app_metadata?.test === true && Date.now() - new Date(u.created_at).getTime() > 600_000) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }
  await admin.rpc('cleanup_test_data');
  writeFileSync(FIXTURE, JSON.stringify(testPlant()));
  const w = testWord();
  writeFileSync(WORD_FILE, JSON.stringify({ letter: '_', count: 1, entries: [w] }));
  writeFileSync(WORD_IDX, JSON.stringify([{ sk: w.sort_key, hw: w.headword, id: w.id, pos: w.pos, eq: 'test', eq_sw: 'jaribio', eq_dg: 'majaribio' }]));
  proverbsOriginal = readFileSync(PROVERBS, 'utf-8');
  writeFileSync(PROVERBS, JSON.stringify([...JSON.parse(proverbsOriginal), testProverb()], null, 2) + '\n');
  let server: ChildProcess | null = null;
  if (!process.env.BASE_URL) {
    // Start from an empty data cache: an earlier aborted run may have cached fixture overlays.
    rmSync(join(process.cwd(), '.next/cache/fetch-cache'), { recursive: true, force: true });
    server = spawn('npx', ['next', 'start', '-p', '3124'], { stdio: 'ignore', detached: true });
    for (let i = 0; i < 60; i++) {
      const ok = await fetch(`${BASE}/api/overlay/plant`).then((r) => r.ok).catch(() => false);
      if (ok) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  const users: string[] = [];
  // Ctrl-C or a killed job still removes the fixture, test data and the throwaway accounts.
  const abort = async () => {
    removeFixtures();
    await admin.rpc('cleanup_test_data');
    for (const id of users) await admin.auth.admin.deleteUser(id);
    if (server?.pid) process.kill(-server.pid);
    process.exit(130);
  };
  process.once('SIGINT', abort);
  process.once('SIGTERM', abort);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const C = await user('ui-contrib');
    const D = await user('ui-second');
    const A = await user('ui-admin');
    users.push(C.id, D.id, A.id);
    await admin.from('profiles').update({ role: 'admin' }).eq('id', A.id);

    console.log('1. signed out: form, sign-in on submit, draft kept');
    const cCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const c = await cCtx.newPage();
    await c.goto(`${BASE}${PLANT}`);
    check('plant page shows the name callout', await visible(c, 'Do you know the right name?'));
    await c.getByText('Do you know the right name?').first().click();
    await c.getByRole('textbox', { name: 'Digo name', exact: true }).fill('jina-ui');
    await shot(c, '01-name-form-desktop');
    await c.getByRole('button', { name: 'Send suggestion' }).click();
    check('submit while signed out asks to sign in', await visible(c, 'Sign in to send your suggestion'));
    await shot(c, '02-sign-in-sheet');
    await signIn(cCtx, C.cookies);
    await c.goto(`${BASE}${PLANT}`);
    check('after sign-in the form reopens with the draft', (await c.getByRole('textbox', { name: 'Digo name', exact: true }).inputValue().catch(() => '')) === 'jina-ui');

    console.log('2. submit, held, My contributions');
    await c.getByRole('button', { name: 'Send suggestion' }).click();
    check('thanks: a reviewer looks first (new contributor)', await visible(c, 'A reviewer will look at it first.'));
    await shot(c, '03-thanks');
    await c.goto(`${BASE}/profile/contributions`);
    check('My contributions lists it as pending', await visible(c, 'Pending'));
    check('…and says it is not public yet', await visible(c, 'Not public yet'));
    await shot(c, '04-my-contributions');
    await c.goto(`${BASE}${PLANT}`);
    await c.waitForTimeout(1500);
    check('held suggestion is not on the public panel', !(await c.getByText('Suggestions under review').count()));

    console.log('3. admin review: accept, live, credit, undo');
    const aCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await signIn(aCtx, A.cookies);
    const a = await aCtx.newPage();
    // A failed status call would leave the review page empty; log it if it happens.
    a.on('response', (r) => r.url().includes('/api/contributions/me') && !r.ok() && console.log('    [note] /me returned', r.status()));
    const t0 = Date.now();
    a.on('response', (r) => r.url().includes('/api/review/queue') && console.log(`    [note] queue ${r.status()} after ${Date.now() - t0}ms`));
    await a.goto(`${BASE}/review`);
    const listed = await visible(a, 'jina-ui');
    check('review queue lists it', listed, listed ? '' : (await a.locator('body').innerText()).slice(0, 400));
    await shot(a, '05-review-queue');
    await a.getByText('jina-ui').first().click();
    check('item view shows the suggestion and current text', (await visible(a, 'The suggestion')) && (await visible(a, 'What the site says now')));
    await shot(a, '06-review-item');
    await a.getByRole('button', { name: 'Accept', exact: true }).click();
    const accepted = await visible(a, 'Saved.');
    check('accept saved', accepted, accepted ? '' : (await a.locator('main').innerText()).slice(-400));
    await c.goto(`${BASE}${PLANT}`);
    check('the plant shows the accepted name', await visible(c, 'jina-ui'));
    check('…credited to a Digo speaker (credit not chosen)', await visible(c, 'Suggested by a Digo speaker'));
    await shot(c, '07-accepted-live');
    console.log('4. public panel, agree, regional form');
    // A returning contributor's region is remembered.
    await c.evaluate(() => localStorage.setItem('contrib-region', 'tanga'));
    await c.getByText('Suggest another name').first().click();
    await c.getByRole('textbox', { name: 'Digo name', exact: true }).fill('jina-tanga');
    await c.getByRole('button', { name: 'Send suggestion' }).click();
    check('second suggestion is public (first was accepted)', await visible(c, 'Others can see it, but not your name.'));
    const dCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await signIn(dCtx, D.cookies);
    const d = await dCtx.newPage();
    await d.goto(`${BASE}${PLANT}`);
    check('another member sees it under review', await visible(d, 'Suggestions under review'));
    check('…anonymously, with its region', await visible(d, /Someone from/));
    const agreeResp = d.waitForResponse((r) => r.url().includes('/agree'), { timeout: 20000 }).catch(() => null);
    await d.getByRole('button', { name: 'Agree' }).first().click();
    const agreeR = await agreeResp;
    const agreed = await visible(d, 'You agree');
    check('agree', agreed, agreed ? '' : `agree response ${agreeR?.status()} ${await agreeR?.text().catch(() => '')}; panel: ${(await d.locator('section').filter({ hasText: 'Suggestions under review' }).innerText().catch(() => '')).slice(0, 200)}`);
    await shot(d, '08-panel-agreed');
    await a.goto(`${BASE}/review`);
    await a.getByText('jina-tanga').first().click();
    await a.getByRole('button', { name: 'Accept as a regional form' }).click();
    check('accepted as a regional form', await visible(a, 'Saved.'));
    await d.goto(`${BASE}${PLANT}`);
    check('regional forms show, headword unchanged', (await visible(d, 'Regional forms')) && (await visible(d, 'jina-tanga')) && (await visible(d, 'jina-ui')));
    await d.waitForTimeout(2000);
    await shot(d, '09b-credits');
    check('…each with its credit line', (await d.getByText('Suggested by a Digo speaker').count()) >= 2, await d.getByText('Suggested by').allInnerTexts());
    await shot(d, '09-regional-form');
    console.log('   undo the first accept');
    await a.goto(`${BASE}/review?undo`);
    await a.getByRole('tab', { name: 'Live' }).click();
    await a.getByText('jina-ui').first().click();
    await a.getByRole('button', { name: 'Undo' }).click();
    check('undo saved', await visible(a, 'Saved.'));
    await c.goto(`${BASE}${PLANT}`);
    check('the original name is back', await visible(c, 'jina ra majaribio'));


    console.log('4b. notifications and the reviewers page');
    await c.goto(`${BASE}/`);
    await c.getByRole('button', { name: /^Tester/ }).first().click();
    const counted = await c.getByText(/^\d+ new$/).first().waitFor({ state: 'attached', timeout: 20000 }).then(() => true, () => false);
    check('menu shows a notifications count', counted);
    await c.goto(`${BASE}/profile/notifications`);
    check('notifications page lists the accept', await visible(c, /Your suggestion “jina-ui” .* was accepted\./));
    await shot(c, '12-notifications');
    await c.goto(`${BASE}/profile/notifications`);
    check('…and reading cleared the unread mark', (await c.locator('[class*="unread"]').count()) === 0);
    await a.goto(`${BASE}/admin/reviewers`);
    await a.getByRole('textbox', { name: 'Find a person by name or email', exact: true }).fill('Tester ui-second');
    await a.getByRole('button', { name: 'Search' }).click();
    check('admin finds a person', await visible(a, 'Tester ui-second'));
    await a.getByText('Plants').first().click();
    await a.getByRole('button', { name: 'Make reviewer' }).first().click();
    check('…and makes them a plants reviewer', await visible(a, 'Saved.'));
    await shot(a, '13-admin-reviewers');
    await d.goto(`${BASE}/review`);
    const opened = await visible(d, 'Suggestions waiting for a decision');
    check('the new reviewer can open Review', opened, opened ? '' : (await d.locator('body').innerText()).slice(0, 300));

    console.log('4c. dictionary: example, regional form, new word');
    const acceptVia = async (type: string) => {
      let row: { id: string } | null = null;
      for (let i = 0; i < 20 && !row; i++) {
        ({ data: row } = await admin.from('contributions').select('id').eq('user_id', D.id).eq('type', type)
          .order('created_at', { ascending: false }).limit(1).maybeSingle());
        if (!row) await new Promise((r) => setTimeout(r, 1000));
      }
      if (!row) return 0;
      return a.evaluate(async (id) => (await fetch(`/api/review/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept' }),
      })).status, row!.id);
    };
    await d.evaluate(() => localStorage.setItem('contrib-region', 'tanga'));
    await d.goto(`${BASE}${WORD}`);
    check('the word page offers "Suggest an edit"', await visible(d, 'Suggest an edit'));
    check('…and "Improve this definition" per meaning', await visible(d, 'Improve this definition'));
    await d.getByRole('button', { name: 'Suggest an edit' }).click();
    await shot(d, '14-word-menu');
    await d.getByRole('menuitem', { name: 'Add an example sentence' }).click();
    await d.getByRole('textbox', { name: 'The sentence in Digo', exact: true }).fill('Ni majaribio ya UI.');
    await d.getByRole('button', { name: 'Send suggestion' }).click();
    check('example sent', await visible(d, 'Asante!', 45000));
    check('…and accepted', (await acceptVia('example_sentence')) === 200);
    await d.goto(`${BASE}${WORD}`);
    check('the example shows on the word', await visible(d, 'Ni majaribio ya UI.'));
    check('…with its credit line', await visible(d, 'Suggested by a Digo speaker'));
    await d.getByRole('button', { name: 'Suggest an edit' }).click();
    await d.getByRole('menuitem', { name: 'Another spelling or regional form' }).click();
    await d.getByRole('textbox', { name: 'Your form', exact: true }).fill('majaribiyo');
    await d.getByRole('button', { name: 'Send suggestion' }).click();
    check('regional form sent', await visible(d, 'Asante!', 45000));
    check('…and accepted', (await acceptVia('spelling_variant')) === 200);
    await d.goto(`${BASE}${WORD}`);
    check('the variant line shows the form and region', (await visible(d, 'Other forms')) && (await visible(d, 'majaribiyo')) && (await visible(d, '(Tanga)')));
    await shot(d, '15-word-variant');
    // "Make this the headword" (spec 34 §18): the admin's button, then both addresses show the entry.
    const { data: formRow } = await admin.from('contributions').select('id').eq('user_id', D.id).eq('type', 'spelling_variant')
      .order('created_at', { ascending: false }).limit(1).single();
    await a.goto(`${BASE}/review/${formRow!.id}`);
    check('the admin sees "Make this the headword"', await visible(a, 'Make this the headword'));
    await a.getByRole('button', { name: 'Make this the headword' }).click();
    check('…with what will happen', await visible(a, 'majaribiyo becomes the headword, and __test__ becomes an other form.'));
    await shot(a, '15b-make-headword');
    await a.getByRole('button', { name: 'Yes, make it the headword' }).click();
    check('…done', await visible(a, 'Saved.', 30000));
    const { data: hcRow } = await admin.from('contributions').select('id').eq('type', 'headword_change').eq('target_id', '__test__')
      .eq('status', 'accepted').limit(1).maybeSingle();
    check('…as a headword change with no author', !!hcRow);
    await d.goto(`${BASE}${WORD}`);
    check('the old address shows the entry under its new headword', await visible(d, 'majaribiyo') && (await d.locator('h1').innerText()).includes('majaribiyo'));
    check('…the old headword under other forms, and the form credited as the headword', (await visible(d, '__test__')) && (await visible(d, 'Headword form')));
    await shot(d, '15c-old-address');
    // (The new address of a test entry isn't checked: test forms never enter the public forms map.)
    if (hcRow) {
      const undone = await a.evaluate(async (id) => (await fetch(`/api/review/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'revert' }),
      })).status, hcRow.id);
      check('the admin undoes it', undone === 200);
    }
    await d.goto(`${BASE}/language/dictionary?q=zzzqqq`);
    check('an empty search offers to add the word', await visible(d, 'Add “zzzqqq” to the dictionary'));
    await d.getByRole('button', { name: 'Add “zzzqqq” to the dictionary' }).click();
    const prefilled = await d.getByRole('textbox', { name: 'The word in Digo', exact: true }).inputValue().catch(() => '');
    check('…with the search as the headword', prefilled === 'zzzqqq', prefilled);
    await d.getByRole('textbox', { name: 'The word in Digo', exact: true }).fill('__test__');
    await d.getByRole('textbox', { name: 'What it means in English', exact: true }).fill('a UI test word');
    await shot(d, '16-new-word');
    await d.getByRole('button', { name: 'Send suggestion' }).click();
    check('new word sent', await visible(d, 'Asante!', 45000));

    console.log('4d. proverbs: how it is used, add a proverb');
    const acceptLatest = async (type: string) => {
      let row: { id: string } | null = null;
      for (let i = 0; i < 20 && !row; i++) {
        ({ data: row } = await admin.from('contributions').select('id').eq('user_id', D.id).eq('type', type)
          .order('created_at', { ascending: false }).limit(1).maybeSingle());
        if (!row) await new Promise((r) => setTimeout(r, 1000));
      }
      if (!row) return 0;
      return a.evaluate(async (id) => (await fetch(`/api/review/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept' }),
      })).status, row.id);
    };
    await d.goto(`${BASE}${PROVERB}`);
    check('the proverb page offers "Suggest an edit"', await visible(d, 'Suggest an edit'));
    await d.getByRole('button', { name: 'Suggest an edit' }).click();
    await d.getByRole('menuitem', { name: 'Tell us how it’s used' }).click();
    await d.getByRole('textbox', { name: 'How is it used?', exact: true }).fill('Grandmothers say it to children.');
    check('…with a language choice', await visible(d, 'Which language are you writing in?'));
    await shot(d, '17-proverb-context');
    await d.getByRole('button', { name: 'Send suggestion' }).click();
    check('story sent', await visible(d, 'Asante!', 45000));
    check('…and accepted', (await acceptLatest('proverb_context')) === 200);
    await d.goto(`${BASE}${PROVERB}`);
    // Wait for the page (and the overlay) to load, then find each paragraph by its exact text.
    const story = d.locator('p', { hasText: /^Grandmothers say it to children\.$/ });
    const shown = await story.first().waitFor({ state: 'visible', timeout: 30000 }).then(() => true, () => false);
    check('the story shows as its own paragraph', shown && await d.locator('p', { hasText: /^Used in tests\.$/ }).first().isVisible());
    await shot(d, '18-proverb-story');
    await d.getByRole('button', { name: 'Suggest an edit' }).click();
    check('the menu offers a word-for-word meaning', await d.getByRole('menuitem', { name: 'Word for word meaning' }).isVisible().catch(() => false));
    await d.getByRole('menuitem', { name: 'Something’s wrong' }).click();
    check('"Something’s wrong" opens private feedback', await visible(d, 'Your feedback'));
    await d.keyboard.press('Escape');
    await d.getByRole('button', { name: 'Do you say it differently?' }).first().click();
    await d.getByRole('textbox', { name: 'How you say it', exact: true }).fill('Methali ya kujaribu');
    await d.getByRole('button', { name: 'Send suggestion' }).click();
    check('variant sent from the inline offer', await visible(d, 'Asante!', 45000));
    check('…and accepted', (await acceptLatest('proverb_variant')) === 200);
    await d.goto(`${BASE}${PROVERB}`);
    check('the variant shows under other forms', await visible(d, 'Methali ya kujaribu', 30000));
    await d.goto(`${BASE}/language/proverbs`);
    await d.getByRole('button', { name: 'Add a proverb' }).first().click();
    check('"Add a proverb" opens the form', await visible(d, 'The proverb in Digo'));
    await shot(d, '19-new-proverb');

    console.log('4e. translation fixes (Swahili page)');
    await d.goto(`${BASE}/sw${PLANT}`);
    check('a Swahili plant page offers "Fix this translation"', await visible(d, 'Rekebisha tafsiri hii', 30000));
    // The first one sits under the summary (the section links below it open the section form).
    await d.getByRole('button', { name: 'Rekebisha tafsiri hii' }).first().click();
    check('…with the English shown alongside', await visible(d, 'Kwa Kiingereza'));
    await d.getByRole('textbox', { name: 'Maandishi yaliyosahihishwa', exact: true }).fill('Jaribio la mmea');
    check('…and sending waits for what was wrong', await d.getByRole('button', { name: /Tuma/ }).last().isDisabled());
    await d.getByRole('textbox', { name: 'Nini kilikosewa?', exact: true }).fill('Fupi mno');
    await shot(d, '20-translation-fix');
    await d.getByRole('button', { name: /Tuma/ }).last().click();
    check('translation fix sent', await visible(d, 'Asante!', 45000));

    console.log('4f. article fix mode (Swahili article)');
    await d.goto(`${BASE}/sw/culture/kayas/governance`);
    check('a Swahili article offers the fix switch', await visible(d, 'Kuna kosa kwenye tafsiri hii? Irekebishe', 30000));
    check('…with no pencils until it is on', (await d.getByRole('button', { name: /^Rekebisha hii:/ }).count()) === 0);
    await d.getByRole('button', { name: 'Kuna kosa kwenye tafsiri hii? Irekebishe' }).first().click();
    check('…then a pencil on every block and the title', (await d.getByRole('button', { name: /^Rekebisha hii:/ }).count()) > 5);
    await d.getByRole('button', { name: /^Rekebisha hii: Aya/ }).first().click();
    check('…a pencil opens the fix sheet with the English', await visible(d, 'Kwa Kiingereza'));
    await shot(d, '21-article-fix');
    await d.keyboard.press('Escape');
    await d.goto(`${BASE}/culture/kayas/governance`);
    await d.waitForTimeout(3000);
    check('English articles have no fix switch', (await d.getByRole('button', { name: /Something wrong in this translation/ }).count()) === 0);

    console.log('4g. fix a translation on this page (Swahili)');
    await d.goto(`${BASE}/sw/history`);
    await d.waitForTimeout(3000);
    await d.getByRole('button', { name: 'Rekebisha tafsiri kwenye ukurasa huu' }).click();
    await d.getByRole('textbox', { name: 'Tafuta maandishi kwenye ukurasa huu' }).waitFor({ timeout: 15000 });
    await d.waitForTimeout(500);
    const uiListed = await d.getByRole('dialog').locator('li button').count();
    check('the footer link lists the page’s text', uiListed > 5, String(uiListed));
    await d.getByRole('textbox', { name: 'Tafuta maandishi kwenye ukurasa huu' }).fill('Historia');
    check('…search narrows it', await visible(d, 'Historia'));
    await d.getByRole('dialog').locator('li button', { hasText: 'Historia' }).first().click();
    check('…picking one shows its English', await visible(d, 'Kwa Kiingereza'));
    await shot(d, '22-ui-fix');
    await d.keyboard.press('Escape');
    await d.goto(`${BASE}/history`);
    await d.waitForTimeout(2000);
    check('English pages have no such link', (await d.getByRole('button', { name: /Fix a translation on this page/ }).count()) === 0);

    console.log('5. phone layout, offline, feedback');
    const p = await cCtx.newPage();
    await p.setViewportSize({ width: 390, height: 844 });
    await p.goto(`${BASE}${PLANT}`);
    await p.getByText('Suggest a correction').first().click();
    check('correction form opens on a phone', await visible(p, 'Your text'));
    await shot(p, '10-phone-sheet');
    await cCtx.setOffline(true);
    check('offline: says so', await visible(p, 'You’re offline'));
    check('offline: send is disabled', await p.getByRole('button', { name: 'Send suggestion' }).isDisabled());
    await shot(p, '11-offline');
    await cCtx.setOffline(false);
    await c.goto(`${BASE}/`);
    await c.getByRole('button', { name: 'Feedback' }).click();
    await c.getByRole('textbox', { name: 'Your feedback', exact: true }).fill('UI test feedback');
    await c.getByRole('button', { name: 'Send suggestion' }).click();
    check('footer feedback sent', await visible(c, 'A reviewer will read it.'));

    console.log('5b. stale offline data (ISSUES DATA-1)');
    const s1 = await browser.newContext();
    const sp = await s1.newPage();
    await sp.goto(`${BASE}/language/dictionary`);
    await sp.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 30000 }).catch(() => null);
    const controlled = await sp.evaluate(() => navigator.serviceWorker?.controller != null);
    // A device that cached s.json before "sasisha" existed, and has already recorded today's version.
    await sp.evaluate(async () => {
      const fresh = await (await fetch('/data/s.json', { cache: 'no-store' })).json();
      const old = { ...fresh, entries: fresh.entries.filter((e: { headword: string }) => e.headword !== 'sasisha') };
      const cache = await caches.open('chidigo-dict');
      await cache.put('/data/s.json', new Response(JSON.stringify(old), { headers: { 'Content-Type': 'application/json' } }));
      const v = await (await fetch('/data/data-version.json', { cache: 'no-store' })).json();
      localStorage.setItem('chidigo-data-version-seen', JSON.stringify(v));
    });
    await sp.goto(`${BASE}/language/dictionary/word/sasisha`);
    check(`a word missing from a stale cached letter file still opens (service worker ${controlled ? 'active' : 'inactive'})`,
      await visible(sp, 'to update, to refresh'));
    // A device whose recorded version is old: the stale cache is dropped before data loads.
    await sp.evaluate(async () => {
      const fresh = await (await fetch('/data/s.json', { cache: 'no-store' })).json();
      const old = { ...fresh, entries: fresh.entries.filter((e: { headword: string }) => e.headword !== 'sasisha') };
      await (await caches.open('chidigo-dict')).put('/data/s.json', new Response(JSON.stringify(old), { headers: { 'Content-Type': 'application/json' } }));
      localStorage.setItem('chidigo-data-version-seen', JSON.stringify({ dict: 'old' }));
    });
    await sp.goto(`${BASE}/language/dictionary/word/sasisha`);
    check('an outdated device drops its stale dictionary cache', await visible(sp, 'to update, to refresh'));
    const stillOld = await sp.evaluate(async () => {
      const r = await (await caches.open('chidigo-dict')).match('/data/s.json');
      if (!r) return false;
      return !(await r.json()).entries.some((e: { headword: string }) => e.headword === 'sasisha');
    });
    check('…and the cached letter file is current afterwards', !stillOld);
    await s1.close();

    console.log('6. indexing');
    for (const path of ['/review', '/sw/review', '/profile/contributions']) {
      const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
      check(`${path} has X-Robots-Tag noindex`, (res.headers.get('x-robots-tag') ?? '').includes('noindex'), res.headers.get('x-robots-tag'));
    }
    const html = await (await fetch(`${BASE}/review`)).text();
    check('/review page carries a noindex meta tag', /<meta name="robots" content="noindex/.test(html));
  } finally {
    await browser.close();
    removeFixtures();
    if (server?.pid) process.kill(-server.pid);
    const { data } = await admin.rpc('cleanup_test_data');
    for (const id of users) await admin.auth.admin.deleteUser(id);
    console.log(`cleanup: ${JSON.stringify(data)}, ${users.length} users removed; screenshots in ${SHOTS}`);
  }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  removeFixtures();
  process.exit(1);
});
