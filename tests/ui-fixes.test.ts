/**
 * Interface-string fixes (spec 34 §17.12, phase 5d): keys, denied namespaces, the text rules against
 * English, apply and undo by value, and fold-in on a copy of the message files.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { applyUi, unapplyUi, uiKeyAllowed, uiText, uiTextProblem, type MessageTree } from '@/lib/contributions/apply/ui';
import { ConflictError, type Change } from '@/lib/contributions/apply/types';

const ROOT = process.cwd();
const msgs = (l: string) => JSON.parse(readFileSync(join(ROOT, 'lib/i18n/messages', `${l}.json`), 'utf-8')) as MessageTree;
const fix = (m: MessageTree, key: string, proposed: string, id = '00000000-0000-4000-8000-000000000901'): Change => ({
  contribution_id: id, type: 'translation_fix', target_type: 'ui', target_id: '/', target_path: key, outcome: 'replace',
  final_payload: { lang: 'sw', proposed }, base: { value: { text: uiText(m, key) } },
} as Change);

describe('keys and rules', () => {
  it('allows reader-facing keys only', () => {
    expect(uiKeyAllowed('nav.home_link')).toBe(true);
    expect(uiKeyAllowed('auth.sign_in')).toBe(false);
    expect(uiKeyAllowed('review.err_pii')).toBe(false);
    expect(uiKeyAllowed('nav.__proto__')).toBe(false);
    expect(uiKeyAllowed('nav')).toBe(false);
    expect(uiText(msgs('en'), 'nav.constructor')).toBeNull();
  });
  it('checks placeholders, Digo markers, length and change against English', () => {
    expect(uiTextProblem('Hello {name}', 'Habari {name}', 'Habari {name}')).toBe('unchanged');
    expect(uiTextProblem('Hello {name}', 'Habari {name}', 'Habari yako')).toBe('placeholders');
    expect(uiTextProblem('The {dig:kaya}s', 'Makaya', 'Ma{dig:kaya}')).toBeNull();
    expect(uiTextProblem('The {dig:kaya}s', 'Makaya', 'Makaya ya leo')).toBe('markers');
    expect(uiTextProblem('Home', 'Nyumbani', 'x'.repeat(60))).toBe('too_long_ui');
    expect(uiTextProblem('Home', '', 'Home')).toBe('unchanged');
    expect(uiTextProblem('Home', '', 'Mwanzo')).toBeNull();
    expect(uiTextProblem('Home', 'Nyumbani', 'Tembelea scam.example.com')).toBe('links');
    expect(uiTextProblem('Home', 'Nyumbani', 'Nenda www.example.org')).toBe('links');
  });
});

describe('apply and undo by value', () => {
  it('applies, is idempotent, conflicts when moved on, and undoes to the exact bytes', () => {
    const sw = msgs('sw');
    const c = fix(sw, 'nav.home_link', 'Mwanzo');
    const a = applyUi(sw, c);
    expect(uiText(a, 'nav.home_link')).toBe('Mwanzo');
    expect(applyUi(a, c)).toBe(a);
    expect(JSON.stringify(unapplyUi(a, c))).toBe(JSON.stringify(sw));
    const moved = applyUi(sw, fix(sw, 'nav.home_link', 'Nyumbani kuu', '00000000-0000-4000-8000-000000000902'));
    expect(() => applyUi(moved, c)).toThrow(ConflictError);
    expect(() => unapplyUi(moved, c)).toThrow(ConflictError);
  });
});

describe('fold-in for interface fixes', () => {
  let dir: string;
  const FILES = ['lib/i18n/messages/sw.json', 'lib/i18n/messages/dg.json'];
  const before: Record<string, string> = {};
  const tsx = join(ROOT, 'node_modules/.bin/tsx');
  const run = (rows: unknown[], tag: string) => {
    const inPath = join(dir, `claimed-${tag}.json`);
    const outPath = join(dir, `results-${tag}.json`);
    writeFileSync(inPath, JSON.stringify({ nonce: '00000000-0000-0000-0000-000000000000', rows }));
    execFileSync(tsx, ['scripts/fold-in/apply.ts', '--data', dir, '--in', inPath, '--out', outPath], { cwd: ROOT });
    return JSON.parse(readFileSync(outPath, 'utf-8'));
  };
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'fold-ui-'));
    for (const d of ['public/data', 'content/plants', 'content/articles', 'lib/i18n/messages']) {
      mkdirSync(join(dir, d, '..'), { recursive: true });
      cpSync(join(ROOT, d), join(dir, d), { recursive: true });
    }
    for (const f of FILES) before[f] = readFileSync(join(dir, f), 'utf-8');
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('writes sw and dg in place, keeps the format, refuses bad keys and English, and reverts exactly', () => {
    const common = { outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, live_status: 'live', type: 'translation_fix', target_type: 'ui', target_id: '/' };
    const sw = msgs('sw');
    const dg = msgs('dg');
    const rows = [
      { ...common, id: '00000000-0000-4000-8000-000000000911', target_path: 'nav.home_link', final_payload: { lang: 'sw', proposed: 'Mwanzo' }, base: { value: { text: uiText(sw, 'nav.home_link') } } },
      { ...common, id: '00000000-0000-4000-8000-000000000912', target_path: 'footer.about_heading', final_payload: { lang: 'dg', proposed: 'Maoni gako' }, base: { value: { text: uiText(dg, 'footer.about_heading') } } },
    ];
    const bad = [
      { ...common, id: '00000000-0000-4000-8000-000000000913', target_path: 'auth.sign_in', final_payload: { lang: 'sw', proposed: 'x' }, base: { value: { text: '' } } },
      { ...common, id: '00000000-0000-4000-8000-000000000914', target_path: 'nav.home_link', final_payload: { lang: 'en', proposed: 'x' }, base: { value: { text: 'Home' } } },
    ];
    const r = run([...rows, ...bad], 'apply');
    expect(r.applied).toHaveLength(2);
    expect(r.failed).toHaveLength(2);
    for (const f of FILES) {
      const t = readFileSync(join(dir, f), 'utf-8');
      expect(t).not.toBe(before[f]);
      expect(t).toBe(JSON.stringify(JSON.parse(t), null, 2) + '\n');
    }
    expect(readFileSync(join(dir, 'lib/i18n/messages/en.json'), 'utf-8')).toBe(readFileSync(join(ROOT, 'lib/i18n/messages/en.json'), 'utf-8'));
    const back = run(rows.map((x) => ({ ...x, live_status: 'reverting' })), 'revert');
    expect(back.reverted).toHaveLength(2);
    for (const f of FILES) expect(readFileSync(join(dir, f), 'utf-8')).toBe(before[f]);
  });
});
