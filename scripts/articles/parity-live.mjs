/**
 * Rendered-text parity for the article pages (spec 34 §17.10 gate): loads every culture, history and
 * language article, figure page and index page in en, sw and dg from two sites and compares the
 * visible text of <main>. Exits non-zero on any difference.
 *
 *   node scripts/articles/parity-live.mjs <baseA> <baseB>
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { chromium } from 'playwright-core';

const [A, B] = process.argv.slice(2);
if (!A || !B) throw new Error('usage: parity-live.mjs <baseA> <baseB>');
const ROOT = join(process.cwd(), 'content/articles');
const json = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf-8'));
const paths = ['/culture', '/history', '/history/figures', '/language'];
for (const d of json('culture/_domains.json')) {
  paths.push(`/culture/${d.slug}`);
  for (const t of d.topics) paths.push(`/culture/${d.slug}/${t}`);
}
for (const t of json('history/_domains.json')[0].topics) paths.push(`/history/${t}`);
for (const t of json('language/_domains.json')[0].topics) paths.push(`/language/${t}`);
for (const f of readdirSync(join(ROOT, 'figures'))) if (json(`figures/${f}`).published) paths.push(`/history/figures/${f.replace(/\.json$/, '')}`);

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext();
async function text(base, path, locale) {
  const url = `${base}${locale === 'en' ? '' : `/${locale}`}${path}`;
  for (let attempt = 0; ; attempt++) {
    const page = await ctx.newPage();
    try {
      // Analytics keep the network busy: wait for load, then for the text to settle.
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      let prev = '';
      let t = '';
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(500);
        // The page's content only: no header, navigation, footer or fixed overlays (cookie banner).
        t = await page.evaluate(() => {
          for (const el of document.querySelectorAll('body *')) {
            if (el.matches('header, footer, nav') || getComputedStyle(el).position === 'fixed') el.style.display = 'none';
          }
          return (document.querySelector('main') ?? document.body).innerText.replace(/\s+/g, ' ').trim();
        });
        if (t && t === prev) break;
        prev = t;
      }
      return t;
    } catch (e) {
      if (attempt >= 2) throw e;
    } finally {
      await page.close();
    }
  }
}
let diffs = 0;
let n = 0;
const jobs = paths.flatMap((p) => ['en', 'sw', 'dg'].map((l) => [p, l]));
const worker = async () => {
  while (jobs.length) {
    const [p, l] = jobs.shift();
    const [a, b] = await Promise.all([text(A, p, l), text(B, p, l)]);
    n++;
    if (a !== b) {
      diffs++;
      let i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      console.log(`DIFF ${l} ${p}\n  A: …${a.slice(Math.max(0, i - 60), i + 80)}\n  B: …${b.slice(Math.max(0, i - 60), i + 80)}`);
    }
  }
};
await Promise.all([worker(), worker(), worker(), worker()]);
await browser.close();
console.log(`${n} pages compared, ${diffs} different`);
process.exit(diffs ? 1 : 0);
