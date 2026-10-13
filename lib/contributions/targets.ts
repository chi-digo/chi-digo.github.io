/**
 * What a contribution points at (spec 34 technical §3): checks the target exists in the published
 * data and records `base`, the text the suggestion was made against, for later conflict checks.
 * Reads the derived JSON the app ships, as the page routes already do.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import type { Plant } from '@/lib/plants/types';
import type { Locale } from '@/lib/i18n/config';
import { stableStringify } from './text';
import { plantNameBase, plantInfoBase, applyAllToPlant } from './apply/plants';
import type { Change } from './apply/types';
import { TEST_TARGET, type ContributionType, type TargetType } from './schemas';

const PLANTS = join(process.cwd(), 'public/data/plants/p');

export interface Target {
  label: string;
  /** The field the change touches, built on the server (never taken from the client). */
  path: string | null;
  base?: { value: unknown; hash: string };
}

function withHash(value: unknown) {
  return { value, hash: createHash('sha256').update(stableStringify(value ?? null)).digest('hex') };
}

export function loadPlant(slug: string): Plant | null {
  if (!/^[\w-]+$/.test(slug)) return null;
  const file = join(PLANTS, `${slug}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8')) as Plant;
}

/** A stand-in plant for automated tests (never listed; test rows are invisible elsewhere). */
export function testPlant(): Plant {
  return {
    id: 'test', slug: TEST_TARGET, digo_headword: 'jina ra majaribio', digo_alt: [], english: 'Test plant', swahili: null,
    scientific: 'Testus plantus', family: null, section: 'test', themes: [], teaser: { en: 'Test', sw: null, dg: null },
    name_status: 'missing', has_parts: false, has_prose: { en: true, sw: false, dg: false }, digo: null, digo_source: null,
    other_mijikenda: null, summary: { en: 'Test', sw: null, dg: null }, sections: { uses: { en: 'Test uses.', sw: null, dg: null } },
    related: [], parts: [], taxon: null, mgombato: [], sources: [], digo_proposals: [], name_credit: null,
  };
}

/**
 * The target as readers currently see it (published data plus live accepted changes), with the
 * base for update types. Returns null if the target doesn't exist.
 */
export function resolveTarget(
  type: ContributionType,
  targetType: TargetType | undefined,
  targetId: string | undefined,
  payload: Record<string, unknown>,
  opts: { isTest: boolean; liveChanges?: Change[] },
): Target | null {
  if (type === 'general_feedback') return { label: targetId ?? '', path: null };
  if (targetType !== 'plant' || !targetId) return null;

  const raw = targetId === TEST_TARGET ? (opts.isTest ? testPlant() : null) : loadPlant(targetId);
  if (!raw) return null;
  const plant = applyAllToPlant(raw, opts.liveChanges ?? []);
  const label = [plant.digo_headword, plant.english].filter(Boolean).join(' · ');

  if (type === 'plant_name') return { label, path: 'digo_headword', base: withHash(plantNameBase(plant)) };
  if (type === 'plant_info') {
    const section = payload.section as Parameters<typeof plantInfoBase>[1];
    const lang = payload.lang as Locale;
    return { label, path: `sections.${section}.${lang}`, base: withHash(plantInfoBase(plant, section, lang)) };
  }
  return null;
}
