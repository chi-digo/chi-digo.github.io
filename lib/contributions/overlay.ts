/**
 * The live overlay (spec 34 technical §1, §3): accepted changes that readers see straight away,
 * before fold-in writes them into the data files. One cached list per area, merged in the loader.
 */
import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import type { Change } from './apply/types';
import { stableStringify } from './text';
import { TEST_TARGET, NEVER_PUBLIC, type ContributionType } from './schemas';

const AREA_TARGETS: Record<string, string[]> = {
  plant: ['plant', 'glossary'],
  word: ['word'],
  proverb: ['proverb'],
};

export const OVERLAY_AREAS = Object.keys(AREA_TARGETS);

/**
 * The payload fields each type may show the public (spec 34 §15.3). Reasons, flag details and other
 * names never leave the server; the appliers read only these fields.
 */
const PUBLIC_FIELDS: Partial<Record<ContributionType, string[]>> = {
  word_addition: ['headword', 'pos', 'meaning_en', 'meaning_sw', 'definition_dg', 'example_dg', 'example_en', 'example_sw'],
  definition_update: ['sense_id', 'lang', 'text', 'mode'],
  example_sentence: ['sense_id', 'dg', 'en', 'sw'],
  spelling_variant: ['form', 'kind'],
  plant_name: ['name', 'choice'],
  plant_info: ['section', 'lang', 'mode', 'text'],
  plant_addition: ['digo', 'swahili', 'english', 'description', 'uses'],
  proverb_addition: ['digo', 'literal_en', 'meaning_en', 'meaning_sw', 'meaning_dg', 'usage'],
  proverb_variant: ['form'],
  proverb_meaning: ['lang', 'text', 'kind'],
  proverb_context: ['text'],
  translation_fix: ['lang', 'current', 'proposed'],
};
const PRIVATE_FIELDS = ['reason', 'detail', 'other_names'];

export function publicPayload(type: ContributionType, payload: Record<string, unknown>): Record<string, unknown> {
  // Unknown types show nothing: a new private field is hidden by default.
  const allow = PUBLIC_FIELDS[type] ?? [];
  return Object.fromEntries(Object.entries(payload ?? {}).filter(([k]) => allow.includes(k) && !PRIVATE_FIELDS.includes(k)));
}

/** Folded changes stay in the overlay this long, for browsers holding older cached data files. */
const FOLDED_GRACE_DAYS = 14;

async function loadAreaOverlay(area: string): Promise<Change[]> {
  const db = createServiceClient();
  const since = new Date(Date.now() - FOLDED_GRACE_DAYS * 86_400_000).toISOString();
  const { data, error } = await db
    .from('contributions')
    .select('id, type, target_id, target_path, payload, final_payload, outcome, region, confidence, base, fold_status, folded_at, reviewed_at')
    .eq('status', 'accepted')
    .eq('live_status', 'live')
    // Test rows only ever target the fixture plant, which no page reads; real targets never see them.
    .or(`is_test.eq.false,target_id.eq.${TEST_TARGET}`)
    .in('target_type', AREA_TARGETS[area])
    .not('type', 'in', `(${NEVER_PUBLIC.join(',')})`)
    .or(`fold_status.is.null,fold_status.neq.folded,folded_at.gt.${since}`)
    .order('reviewed_at', { ascending: true })
    .limit(2000);
  if (error) throw new Error(`overlay ${area}: ${error.message}`);
  return (data ?? []).map((r) => ({
    contribution_id: r.id,
    type: r.type,
    target_id: r.target_id,
    target_path: r.target_path,
    final_payload: publicPayload(r.type, r.final_payload ?? r.payload),
    outcome: r.outcome,
    region: r.region,
    confidence: r.confidence,
    edited: !!r.final_payload && stableStringify(r.final_payload) !== stableStringify(r.payload),
    base: r.base ? { value: r.base.value } : null,
  }));
}

/** Accepted, live changes for an area. Cached across requests; accept, revert and pause revalidate it. */
export function getAreaOverlay(area: string): Promise<Change[]> {
  if (!AREA_TARGETS[area]) return Promise.resolve([]);
  return unstable_cache(() => loadAreaOverlay(area), ['contrib-overlay', area], {
    tags: ['overlay', `overlay:${area}`],
    revalidate: 300,
  })();
}
