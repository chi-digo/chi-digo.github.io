/**
 * Build the shipped plants files from the source (spec 34 technical §6.3; replaces
 * context/plants/sync-to-app.py).
 *
 *   npx tsx scripts/plants/build-plants-data.ts            write public/data/plants and bump `plants`
 *   npx tsx scripts/plants/build-plants-data.ts --no-bump  write without bumping data-version
 *   npx tsx scripts/plants/build-plants-data.ts --check    exit 1 if the shipped files are out of date
 *   --root <dir>   work on another checkout (fold-in uses this); --source <dir> read plants.json elsewhere
 *
 * Reads content/plants/plants.json and glossary.json. Review-only fields (fact_flags, research) are
 * never in the app's source: they stay private in context/plants/plants.review.json.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { deriveStub, derivePlant, compactJson, type SourcePlant } from '../../lib/plants/derive';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const root = resolve(opt('--root') ?? process.cwd());
const sourceDir = resolve(opt('--source') ?? join(root, 'content/plants'));
const out = join(root, 'public/data/plants');
const check = args.includes('--check');

const plants = JSON.parse(readFileSync(join(sourceDir, 'plants.json'), 'utf-8')) as SourcePlant[];
const glossary = JSON.parse(readFileSync(join(sourceDir, 'glossary.json'), 'utf-8'));

const files = new Map<string, string>();
const index = plants.map((p) => {
  const stub = deriveStub(p);
  files.set(`p/${p.slug}.json`, compactJson(derivePlant(p, stub)));
  return stub;
});
files.set('index.json', compactJson(index));
files.set('glossary.json', compactJson(glossary));

if (check) {
  const problems: string[] = [];
  for (const [rel, body] of files) {
    const path = join(out, rel);
    if (!existsSync(path)) problems.push(`missing ${rel}`);
    else if (readFileSync(path, 'utf-8') !== body) problems.push(`stale ${rel}`);
  }
  const shipped = existsSync(join(out, 'p')) ? readdirSync(join(out, 'p')).map((f) => `p/${f}`) : [];
  for (const rel of shipped) if (!files.has(rel)) problems.push(`extra ${rel}`);
  if (problems.length) {
    console.error(`plants: ${problems.length} file(s) out of date with content/plants. Run npx tsx scripts/plants/build-plants-data.ts`);
    for (const p of problems.slice(0, 10)) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`plants: ${plants.length} plants, shipped files match the source`);
  process.exit(0);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'p'), { recursive: true });
for (const [rel, body] of files) writeFileSync(join(out, rel), body);
console.log(`${plants.length} plants -> public/data/plants; sw prose: ${index.filter((s) => s.has_prose.sw).length}, dg prose: ${index.filter((s) => s.has_prose.dg).length}`);
if (!args.includes('--no-bump')) {
  // Same format as scripts/bump-data-version.py, done here so fold-in never runs code from the data checkout.
  const path = join(root, 'public/data/data-version.json');
  const v = JSON.parse(readFileSync(path, 'utf-8'));
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}.${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
  v.plants = stamp;
  v.version = stamp;
  writeFileSync(path, JSON.stringify(v, null, 2) + '\n');
  console.log(`data-version: plants -> ${stamp}`);
}
