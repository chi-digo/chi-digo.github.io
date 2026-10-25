/**
 * Article translation fixes (spec 34 §17.11, phase 5c): paths from structured fields, every kind of
 * target (block, title, figure subtitle and detail line, timeline event), conflicts, idempotency,
 * exact-byte undo, live merge by article id, and fold-in on a temporary checkout.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { applyArticle, unapplyArticle, articlePath, articleText, articleSource, applyAllToArticle, type ArticleData } from '@/lib/contributions/apply/articles';
import { ConflictError, type Change } from '@/lib/contributions/apply/types';

const ROOT = process.cwd();
const A = 'content/articles';
const read = (rel: string) => JSON.parse(readFileSync(join(ROOT, A, rel), 'utf-8')) as ArticleData;
const bytes = (x: unknown) => JSON.stringify(x, null, 2) + '\n';

let n = 0;
function fix(article: ArticleData, id: string, path: string, proposed: string): Change {
  n += 1;
  return {
    contribution_id: `00000000-0000-4000-8000-0000000007${String(n).padStart(2, '0')}`, type: 'translation_fix', target_type: 'article', target_id: id,
    target_path: path, outcome: 'replace', region: 'tanga', confidence: 'native', final_payload: { lang: path.slice(-2), proposed },
    base: { value: { text: articleText(article, path) } },
  } as Change;
}

describe('article paths', () => {
  it('are built only for fixable blocks', () => {
    expect(articlePath('culture/kayas/governance', 'block', 'sw', 'b002')).toBe('blocks.b002.sw');
    expect(articlePath('culture/kayas/governance', 'title', 'dg')).toBe('title.dg');
    expect(articlePath('culture/kayas/governance', 'title', 'en')).toBeNull();
    expect(articlePath('culture/kayas/governance', 'subtitle', 'sw')).toBeNull();
    expect(articlePath('figures/bandilo', 'subtitle', 'sw')).toBe('subtitle.sw');
    // A figure's page shows its card name and no detail lines: neither is fixable.
    expect(articlePath('figures/bandilo', 'meta', 'dg', 'm02')).toBeNull();
    expect(articlePath('figures/bandilo', 'title', 'dg')).toBeNull();
    expect(articlePath('timeline', 'description', 'sw', 't-3f9a')).toBe('events.t-3f9a.description.sw');
    expect(articlePath('timeline', 'block', 'sw', 'b001')).toBeNull();
    expect(articlePath('culture/kayas/governance', 'block', 'sw', '__proto__')).toBeNull();
  });
  it('read own properties only', () => {
    const a = read('culture/kayas/governance.json');
    expect(articleText(a, 'blocks.b999.sw')).toBeNull();
    expect(articleText({ title: Object.create({ sw: 'inherited' }) }, 'title.sw')).toBeNull();
  });
});

describe('applying and undoing', () => {
  const cases: [string, string][] = [
    ['culture/kayas/governance', 'blocks.b002.sw'],
    ['history/singwaya', 'title.dg'],
    ['figures/bandilo', 'blocks.b003.sw'],
    ['figures/bandilo', 'subtitle.dg'],
  ];
  it.each(cases)('%s %s', (id, path) => {
    const a = read(`${id}.json`);
    const c = fix(a, id, path, 'Maandishi mapya ya majaribio.');
    const b = applyArticle(a, c);
    expect(articleText(b, path)).toBe('Maandishi mapya ya majaribio.');
    // Real data may already carry folded fixes on the same block: find this change's own entry.
    expect(b.provenance?.[path]?.find((e) => e.c === c.contribution_id)).toMatchObject({ c: c.contribution_id, kind: 'translation' });
    expect(applyArticle(b, c)).toBe(b);
    expect(bytes(unapplyArticle(b, c))).toBe(bytes(a));
  });
  it('timeline events', () => {
    const t = read('timeline.json');
    const ev = t.events![3];
    const path = `events.${ev.id}.description.sw`;
    const c = fix(t, 'timeline', path, 'Maelezo mapya.');
    const b = applyArticle(t, c);
    expect(b.events![3].description.sw).toBe('Maelezo mapya.');
    expect(bytes(unapplyArticle(b, c))).toBe(bytes(t));
  });
  it('conflicts when the text moved on, refuses English, and undo refuses an edited block', () => {
    const a = read('culture/kayas/governance.json');
    const c = fix(a, 'culture/kayas/governance', 'blocks.b002.sw', 'Mpya');
    expect(() => applyArticle(applyArticle(a, fix(a, 'culture/kayas/governance', 'blocks.b002.sw', 'Nyingine')), c)).toThrow(ConflictError);
    expect(() => applyArticle(a, { ...c, target_path: 'blocks.b002.en', base: { value: { text: articleText(a, 'blocks.b002.en') } } })).toThrow(ConflictError);
    const b = applyArticle(a, c);
    expect(() => unapplyArticle({ ...b, blocks: b.blocks!.map((x) => (x.id === 'b002' ? { ...x, sw: 'by hand' } : x)) }, c)).toThrow(ConflictError);
  });
  it('the live merge applies only this article’s fixes', () => {
    const a = read('culture/kayas/governance.json');
    const c = fix(a, 'culture/kayas/governance', 'blocks.b002.sw', 'Mpya');
    expect(articleText(applyAllToArticle(a, 'culture/kayas/governance', [c]), 'blocks.b002.sw')).toBe('Mpya');
    expect(applyAllToArticle(a, 'culture/kayas/threats', [c])).toBe(a);
    expect(applyAllToArticle(a, 'culture/kayas/governance', [{ ...c, target_type: 'plant' }])).toBe(a);
  });
  it('shows the English and the Swahili of the block', () => {
    const a = read('culture/kayas/governance.json');
    expect(articleSource(a, 'blocks.b002.dg')).toBe(articleText(a, 'blocks.b002.en'));
    expect(articleSource(a, 'blocks.b002.dg', 'sw')).toBe(articleText(a, 'blocks.b002.sw'));
  });
});

describe('fold-in for article fixes', () => {
  let dir: string;
  const FILES = [`${A}/culture/kayas/governance.json`, `${A}/figures/bandilo.json`, `${A}/timeline.json`];
  const before: Record<string, string> = {};
  const tsx = join(ROOT, 'node_modules/.bin/tsx');
  function run(rows: unknown[], tag: string) {
    const inPath = join(dir, `claimed-${tag}.json`);
    const outPath = join(dir, `results-${tag}.json`);
    writeFileSync(inPath, JSON.stringify({ nonce: '00000000-0000-0000-0000-000000000000', rows }));
    execFileSync(tsx, ['scripts/fold-in/apply.ts', '--data', dir, '--in', inPath, '--out', outPath], { cwd: ROOT });
    return JSON.parse(readFileSync(outPath, 'utf-8'));
  }
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'fold-articles-'));
    mkdirSync(join(dir, 'content/plants'), { recursive: true });
    cpSync(join(ROOT, 'public/data'), join(dir, 'public/data'), { recursive: true });
    cpSync(join(ROOT, 'content/plants'), join(dir, 'content/plants'), { recursive: true });
    cpSync(join(ROOT, A), join(dir, A), { recursive: true });
    // The real data checkout is the whole repo; check:articles reads the figure cards and the manifest.
    mkdirSync(join(dir, 'lib/history'), { recursive: true });
    mkdirSync(join(dir, 'lib/articles'), { recursive: true });
    cpSync(join(ROOT, 'lib/history/figures.ts'), join(dir, 'lib/history/figures.ts'));
    cpSync(join(ROOT, 'lib/articles/manifest.json'), join(dir, 'lib/articles/manifest.json'));
    for (const f of FILES) before[f] = readFileSync(join(dir, f), 'utf-8');
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('applies, re-applies with no change, and reverts to the exact bytes', () => {
    const gov = JSON.parse(before[FILES[0]]) as ArticleData;
    const fig = JSON.parse(before[FILES[1]]) as ArticleData;
    const tl = JSON.parse(before[FILES[2]]) as ArticleData;
    const common = { outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, live_status: 'live', type: 'translation_fix', target_type: 'article' };
    const row = (k: number, id: string, a: ArticleData, path: string) => ({
      ...common, id: `00000000-0000-4000-8000-00000000080${k}`, target_id: id, target_path: path,
      final_payload: { lang: path.slice(-2), proposed: `Maandishi ${k}.` }, base: { value: { text: articleText(a, path) } },
    });
    const ev = tl.events![0].id;
    const rows = [
      row(1, 'culture/kayas/governance', gov, 'blocks.b002.sw'),
      row(2, 'culture/kayas/governance', gov, 'title.dg'),
      row(3, 'figures/bandilo', fig, 'blocks.b002.dg'),
      row(4, 'timeline', tl, `events.${ev}.title.sw`),
    ];
    const r1 = run(rows, 'apply');
    expect(r1.failed).toEqual([]);
    expect(r1.applied).toHaveLength(4);
    const after = FILES.map((f) => readFileSync(join(dir, f), 'utf-8'));
    expect(after.every((t, i) => t !== before[FILES[i]] && t.endsWith('\n'))).toBe(true);
    execFileSync(tsx, ['scripts/articles/check.ts', '--root', dir, '--write'], { cwd: ROOT, stdio: 'pipe' });
    expect(run(rows, 'again').applied).toHaveLength(4);
    expect(FILES.map((f) => readFileSync(join(dir, f), 'utf-8'))).toEqual(after);
    const r2 = run([rows[2], rows[0], rows[3], rows[1]].map((x) => ({ ...x, live_status: 'reverting' })), 'revert');
    expect(r2.reverted).toHaveLength(4);
    for (const f of FILES) expect(readFileSync(join(dir, f), 'utf-8')).toBe(before[f]);
  });

  it('reverts two fixes on the same block in one run, newest first', () => {
    const gov = JSON.parse(readFileSync(join(dir, FILES[0]), 'utf-8')) as ArticleData;
    const common = { outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, type: 'translation_fix', target_type: 'article', target_id: 'culture/kayas/governance', target_path: 'blocks.b004.sw' };
    const first = { ...common, live_status: 'live', id: '00000000-0000-4000-8000-000000000811', final_payload: { lang: 'sw', proposed: 'Kwanza.' }, base: { value: { text: articleText(gov, 'blocks.b004.sw') } } };
    const second = { ...common, live_status: 'live', id: '00000000-0000-4000-8000-000000000812', final_payload: { lang: 'sw', proposed: 'Pili.' }, base: { value: { text: 'Kwanza.' } } };
    expect(run([first, second], 'chain').applied).toHaveLength(2);
    const r = run([first, second].map((x) => ({ ...x, live_status: 'reverting' })), 'chain-revert');
    expect(r.failed).toEqual([]);
    expect(r.reverted).toHaveLength(2);
    expect(readFileSync(join(dir, FILES[0]), 'utf-8')).toBe(before[FILES[0]]);
  });

  it('refuses an article id that could be a path', () => {
    const r = run([{ outcome: 'replace', region: 'tanga', confidence: 'native', edited: false, live_status: 'live', type: 'translation_fix', target_type: 'article',
      id: '00000000-0000-4000-8000-000000000899', target_id: '../../package', target_path: 'title.sw', final_payload: { lang: 'sw', proposed: 'x' }, base: { value: { text: 'y' } } }], 'bad');
    expect(r.failed).toHaveLength(1);
  });
});

describe('frozen ids (check:articles --base)', () => {
  it('refuses a new block id that is not past the old ones', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ids-'));
    try {
      for (const rel of ['content/articles', 'lib/history/figures.ts', 'lib/articles/manifest.json']) {
        mkdirSync(join(dir, rel, '..'), { recursive: true });
        cpSync(join(ROOT, rel), join(dir, rel), { recursive: true });
      }
      const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });
      git('init', '-q');
      git('-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '.');
      git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'base');
      const tsx = join(ROOT, 'node_modules/.bin/tsx');
      const check = () => execFileSync(tsx, [join(ROOT, 'scripts/articles/check.ts'), '--root', dir, '--base', 'HEAD'], { cwd: ROOT, stdio: 'pipe' });
      expect(() => check()).not.toThrow();
      const f = join(dir, 'content/articles/culture/kayas/governance.json');
      const a = JSON.parse(readFileSync(f, 'utf-8'));
      a.blocks.push({ ...a.blocks[1], id: 'b000' });
      writeFileSync(f, JSON.stringify(a, null, 2) + '\n');
      expect(() => check()).toThrow(/b000 is not past the old ones/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
