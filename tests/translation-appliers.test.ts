/**
 * Translation fixes, phase 5a (spec 34 §17): paths from structured fields, plants (live, source and
 * list), the glossary and proverb fields; base conflicts, idempotency and exact-byte undo.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { deriveStub, derivePlant, type SourcePlant } from '@/lib/plants/derive';
import { applyPlant, applyPlantStub } from '@/lib/contributions/apply/plants';
import { applySourcePlant, unapplySourcePlant } from '@/lib/contributions/apply/plants-source';
import {
  applyTranslation, unapplyTranslation, translationPath, translationText, translationSource, applyAllToGlossary, pathLang,
} from '@/lib/contributions/apply/translations';
import { applyProverb, unapplyProverb, proverbFieldBase, paragraphCredits, type ProverbEntry } from '@/lib/contributions/apply/proverbs';
import { ConflictError, type Change } from '@/lib/contributions/apply/types';
import { stableStringify } from '@/lib/contributions/strings';
import { sameMarkup } from '@/lib/contributions/text';
import { translationTextProblem } from '@/lib/contributions/review';
import { PAYLOADS } from '@/lib/contributions/schemas';
import type { GlossaryTerm } from '@/lib/plants/types';

const SOURCE = JSON.parse(readFileSync(join(process.cwd(), 'content/plants/plants.json'), 'utf-8')) as SourcePlant[];
const GLOSSARY = JSON.parse(readFileSync(join(process.cwd(), 'content/plants/glossary.json'), 'utf-8')) as GlossaryTerm[];
const PROVERBS = JSON.parse(readFileSync(join(process.cwd(), 'public/data/proverbs/index.json'), 'utf-8')) as ProverbEntry[];
const mnazi = SOURCE.find((p) => p.slug === 'mnazi')!;
const bytes = (x: unknown) => JSON.stringify(x);
const shipped = (x: object) => {
  const o = JSON.parse(stableStringify(x));
  if (Array.isArray(o.digo_alt)) o.digo_alt = [...o.digo_alt].sort();
  return o;
};

let n = 0;
function fix(target: 'plant' | 'glossary' | 'proverb', item: object, path: string, proposed: string, target_id = 'x'): Change {
  const lang = pathLang(path)!;
  const base = target === 'proverb'
    ? proverbFieldBase(item as ProverbEntry, path as Parameters<typeof proverbFieldBase>[1])
    : { text: translationText(item, target, path) };
  n += 1;
  return {
    contribution_id: `00000000-0000-4000-8000-0000000005${String(n).padStart(2, '0')}`, type: 'translation_fix', target_type: target, target_id,
    target_path: path, outcome: 'replace', region: 'tanga', confidence: 'native', final_payload: { lang, proposed }, base: { value: base },
  } as Change;
}

describe('paths', () => {
  it('are built only for fixable blocks', () => {
    expect(translationPath('plant', 'teaser', 'sw')).toBe('teaser.sw');
    expect(translationPath('plant', 'definition', 'dg', 3)).toBe('parts.3.definition.dg');
    expect(translationPath('plant', 'teaser', 'en')).toBeNull();
    expect(translationPath('plant', 'definition', 'sw')).toBeNull();
    expect(translationPath('plant', 'teaser', 'sw', 1)).toBeNull();
    expect(translationPath('glossary', 'definition', 'dg')).toBe('definition.dg');
    expect(translationPath('glossary', 'teaser', 'dg')).toBeNull();
    expect(translationPath('proverb', 'swahili', 'sw')).toBe('swahili');
    expect(translationPath('proverb', 'swahili', 'dg')).toBeNull();
    expect(translationPath('proverb', 'commentary', 'en')).toBe('commentary_en');
  });
  it('never reach a prototype or another field', () => {
    const p = { ...mnazi, parts: [{ term: 'x' }] } as unknown as SourcePlant;
    expect(translationText(p, 'plant', 'parts.0.__proto__.sw')).toBeNull();
    expect(translationText(p, 'plant', 'parts.5.definition.sw')).toBeNull();
    expect(translationText({ definition: Object.create({ sw: 'inherited' }) }, 'glossary', 'definition.sw')).toBeNull();
    const c = fix('plant', mnazi, 'teaser.sw', 'x');
    expect(() => applyTranslation(mnazi, 'plant', { ...c, target_path: 'teaser.en', base: { value: { text: mnazi.teaser.en } } })).toThrow(ConflictError);
  });
  it('the payload refuses unknown fields and needs a reason', () => {
    expect(PAYLOADS.translation_fix.safeParse({ lang: 'sw', field: 'sections', proposed: 'x', reason: 'y' }).success).toBe(false);
    expect(PAYLOADS.translation_fix.safeParse({ lang: 'sw', field: 'teaser', proposed: 'x' }).success).toBe(false);
    expect(PAYLOADS.translation_fix.safeParse({ lang: 'sw', field: 'teaser', proposed: 'x', reason: 'typo' }).success).toBe(true);
  });
});

describe('plants: fold-in and the live overlay agree, and undo is exact', () => {
  const cases: [string, string][] = [['teaser.sw', 'Wadigo wana jina kwa kila hatua ya nazi.'], ['summary.dg', 'Mnazi ni muhi wa chila mudzi.'], ['parts.0.definition.sw', 'Jani la mnazi (kuti).']];
  it.each(cases)('%s', (path, text) => {
    const c = fix('plant', mnazi, path, text, 'mnazi');
    const folded = applySourcePlant(mnazi, c);
    expect(translationText(folded, 'plant', path)).toBe(text);
    expect(shipped(derivePlant(folded))).toEqual(shipped(applyPlant(derivePlant(mnazi), c)));
    expect(applySourcePlant(folded, c)).toBe(folded);
    expect(bytes(unapplySourcePlant(folded, c))).toBe(bytes(mnazi));
    if (path.startsWith('teaser')) {
      const stub = applyPlantStub(deriveStub(mnazi), c);
      expect(stub.teaser.sw).toBe(text);
    }
  });
  it('conflicts when the text moved on, and undo refuses a changed block', () => {
    const c = fix('plant', mnazi, 'teaser.sw', 'Jipya');
    const moved = applySourcePlant(mnazi, fix('plant', mnazi, 'teaser.sw', 'Mwingine'));
    expect(() => applySourcePlant(moved, c)).toThrow(ConflictError);
    const folded = applySourcePlant(mnazi, c);
    const edited = { ...folded, teaser: { ...folded.teaser, sw: 'edited by hand' } };
    expect(() => unapplySourcePlant(edited, c)).toThrow(ConflictError);
  });
  it('shows the English source beside the block', () => {
    expect(translationSource(mnazi, 'plant', 'parts.0.definition.dg')).toBe(mnazi.parts![0].definition.en);
  });
});

describe('glossary', () => {
  it('applies live and folds with exact undo', () => {
    const term = GLOSSARY[0];
    const c = fix('glossary', term, 'definition.dg', 'Kolo ra mmea.', term.term);
    const [live] = applyAllToGlossary([term], [c]);
    expect(live.definition.dg).toBe('Kolo ra mmea.');
    // A plant change with the same id never touches the glossary.
    expect(applyAllToGlossary([term], [{ ...c, target_type: 'plant' }])[0]).toBe(term);
    const folded = applyTranslation(term, 'glossary', c);
    expect(bytes(unapplyTranslation(folded, 'glossary', c))).toBe(bytes(term));
  });
});

describe('proverbs', () => {
  const p = structuredClone(PROVERBS.find((x) => x.id === 'p-001')!);
  it('fixes the Swahili version, marks it community, and undoes to the exact bytes', () => {
    const c = fix('proverb', p, 'swahili', 'Akili ni nywele, kila mtu ana zake', 'p-001');
    const a = applyProverb(p, c);
    expect(a.swahili).toBe('Akili ni nywele, kila mtu ana zake');
    expect(a.field_sources.swahili).toBe('community');
    expect(applyProverb(a, c)).toBe(a);
    expect(bytes(unapplyProverb(a, c))).toBe(bytes(p));
  });
  it('a commentary fix is not credited as a story', () => {
    const c = fix('proverb', p, 'commentary_dg', 'Maelezo mapya.', 'p-001');
    const a = applyProverb(p, c);
    expect(paragraphCredits(a.commentary_dg, a.provenance?.commentary_dg).every((x) => x.c === null)).toBe(true);
    expect(bytes(unapplyProverb(a, c))).toBe(bytes(p));
  });
  it('refuses a path outside the allowed fields', () => {
    const c = { ...fix('proverb', p, 'swahili', 'x', 'p-001'), target_path: 'digo' };
    expect(() => applyProverb(p, c)).toThrow(ConflictError);
  });
});

describe('markup', () => {
  it('must be kept', () => {
    expect(sameMarkup('from the tiny *kolokotsi*', 'kuanzia *kolokotsi* ndogo')).toBe(true);
    expect(sameMarkup('from the tiny *kolokotsi*', 'kuanzia kolokotsi ndogo')).toBe(false);
    expect(sameMarkup('**a** *b*', '*b* **a**')).toBe(true);
  });
});

describe('review-panel fixes', () => {
  it('glossary meanings can be fixed too', () => {
    expect(translationPath('glossary', 'meaning', 'sw')).toBe('meaning.sw');
    const term = GLOSSARY.find((g) => g.meaning?.sw) ?? { ...GLOSSARY[0], meaning: { en: 'm', sw: 'maana', dg: 'maana' } };
    const c = fix('glossary', term, 'meaning.sw', 'Maana mpya.', term.term);
    const folded = applyTranslation(term, 'glossary', c);
    expect(folded.meaning!.sw).toBe('Maana mpya.');
    expect(bytes(unapplyTranslation(folded, 'glossary', c))).toBe(bytes(term));
  });
  it('a commentary fix undoes cleanly after a story was added below it', () => {
    const p = structuredClone(PROVERBS.find((x) => x.id === 'p-001')!);
    const c = fix('proverb', p, 'commentary_en', 'A better commentary.', 'p-001');
    const fixed = applyProverb(p, c);
    const story = { ...c, contribution_id: '00000000-0000-4000-8000-000000000599', type: 'proverb_context', target_path: 'commentary_en', final_payload: { lang: 'en', text: 'A later story.' }, base: null } as Change;
    const both = applyProverb(fixed, story);
    const undone = unapplyProverb(both, c);
    expect(undone.commentary_en).toBe(`${p.commentary_en}\n\nA later story.`);
    expect(undone.field_sources.commentary_en).toBe(p.field_sources.commentary_en);
  });
  it('refuses hidden characters, unchanged text and changed markup', () => {
    expect(PAYLOADS.translation_fix.safeParse({ lang: 'dg', field: 'teaser', proposed: 'ka\u200bya', reason: 'x' }).success).toBe(false);
    expect(translationTextProblem({ text: 'Same' }, ' Same ')).toBe('unchanged');
    expect(translationTextProblem({ text: '*kuti*' }, 'kuti')).toBe('markup');
    expect(translationTextProblem({ text: '*kuti*' }, '*makuti*')).toBeNull();
  });
});
