/**
 * Build-time checks for the plants reference data (spec 33 §11.4, §9a, §9b.5).
 * Fails the build on broken data; warns on missing translations.
 *
 *   npm run validate:plants
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { PLANT_THEMES } from '../lib/plants/themes';
import { DOMAIN_REFERENCES } from '../lib/culture/references';
import type { Plant, PlantStub } from '../lib/plants/types';

const DATA = join(process.cwd(), 'public/data/plants');
const RESERVED = new Set(['theme', 'letter', 'parts']);
const THEMES = new Set(PLANT_THEMES.map((t) => t.slug));
const PART_KINDS = new Set(['leaf', 'stem', 'root', 'flower', 'fruit', 'fruit_stage', 'seed', 'bunch', 'product', 'other']);

const errors: string[] = [];
const warnings: string[] = [];
const index = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf-8')) as PlantStub[];
const slugs = new Set<string>();

for (const stub of index) {
  if (slugs.has(stub.slug)) errors.push(`duplicate slug ${stub.slug}`);
  slugs.add(stub.slug);
  if (RESERVED.has(stub.slug)) errors.push(`reserved slug ${stub.slug}`);
}
const files = new Set(readdirSync(join(DATA, 'p')).map((f) => f.replace(/\.json$/, '')));
for (const slug of slugs) if (!files.has(slug)) errors.push(`${slug}: no p/${slug}.json`);

const missing = { sw: 0, dg: 0 };
for (const stub of index) {
  const p = JSON.parse(readFileSync(join(DATA, 'p', `${stub.slug}.json`), 'utf-8')) as Plant;
  const where = `${p.slug}`;
  if (!p.themes.length) errors.push(`${where}: no themes`);
  for (const t of p.themes) if (!THEMES.has(t)) errors.push(`${where}: unknown theme ${t}`);
  if (!p.teaser?.en) errors.push(`${where}: no English teaser`);
  if (!p.summary?.en) errors.push(`${where}: no English summary`);
  if (!p.sections?.about?.en) errors.push(`${where}: no English 'about' section`);
  for (const r of p.related) {
    if (!slugs.has(r.slug)) errors.push(`${where}: related slug ${r.slug} does not exist`);
    if (r.slug === p.slug) errors.push(`${where}: related to itself`);
  }
  if (p.digo && !p.digo_headword) errors.push(`${where}: Digo names but no headword`);
  if (p.name_status === 'conflict' && !p.digo_proposals.length) errors.push(`${where}: conflict with no proposals`);
  // §9a scientific references
  const identified = p.scientific && !p.scientific.startsWith('Unidentified');
  if (identified && !p.taxon) errors.push(`${where}: scientific name with no taxon reference`);
  if (p.taxon && !p.taxon.links?.gbif) errors.push(`${where}: taxon without a GBIF link`);
  // §9b parts
  const stages: number[] = [];
  for (const part of p.parts ?? []) {
    if (!part.term || !PART_KINDS.has(part.kind) || !part.definition?.en || !part.source) {
      errors.push(`${where}: incomplete part ${part.term || '(no term)'}`);
    }
    if (part.kind === 'fruit_stage') stages.push(part.stage_order ?? -1);
  }
  if (stages.length) {
    const sorted = [...stages].sort((a, b) => a - b);
    if (sorted.some((n, i) => n !== i + 1)) errors.push(`${where}: fruit stages must be numbered 1..${stages.length}`);
  }
  if (!p.has_prose.sw) missing.sw++;
  if (!p.has_prose.dg) missing.dg++;
}

const refCount = DOMAIN_REFERENCES.ecology?.find((r) => r.href.endsWith('/plants'))?.count;
if (refCount !== index.length) errors.push(`Ecology card says ${refCount} plants but the data has ${index.length}; update lib/culture/references.ts`);

warnings.push(`${missing.sw}/${index.length} plants without Swahili prose, ${missing.dg}/${index.length} without Digo (they show the English with a note)`);

for (const w of warnings) console.warn(`warn: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`\n${errors.length} plants data error(s).`);
  process.exit(1);
}
console.log(`plants: ${index.length} entries OK`);
