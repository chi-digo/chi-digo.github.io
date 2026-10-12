/**
 * Fails the build when Digo text uses a form the speaker has ruled out
 * (context/language-standards/README.md). Only unambiguous forms are listed:
 * each one is wrong wherever it appears in Digo text.
 *
 *   npm run check:digo
 *
 * When a new ruling replaces a form everywhere, add it to lib/digo/ruled-out.ts so no data sync,
 * sweep, translation or community contribution can bring it back.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { RULED_OUT } from '../lib/digo/ruled-out';



const ROOT = process.cwd();
const DATA = join(ROOT, 'public/data');

/** Files whose Digo text ships to readers. Legacy quiz banks are history-only and left as recorded. */
function sources(): string[] {
  const files: string[] = [];
  for (const f of readdirSync(DATA)) {
    if (f.endsWith('.json') && !f.endsWith('.idx.json')) files.push(join(DATA, f));
  }
  const plants = join(DATA, 'plants');
  if (existsSync(plants)) {
    files.push(join(plants, 'index.json'), join(plants, 'glossary.json'));
    for (const f of readdirSync(join(plants, 'p'))) files.push(join(plants, 'p', f));
  }
  files.push(
    join(DATA, 'quiz/quiz-bank.json'),
    join(DATA, 'proverbs/index.json'),
    join(ROOT, 'lib/i18n/messages/dg.json'),
    join(ROOT, 'lib/culture/content.ts'),
    join(ROOT, 'lib/language/tools.ts'),
    join(ROOT, 'lib/plants/themes.ts'),
  );
  return files.filter((f) => existsSync(f));
}

const problems: string[] = [];
for (const file of sources()) {
  const text = readFileSync(file, 'utf-8');
  for (const rule of RULED_OUT) {
    if (rule.only && !rule.only.test(file)) continue;
    const global = new RegExp(rule.wrong.source, rule.wrong.flags.includes('g') ? rule.wrong.flags : rule.wrong.flags + 'g');
    const hits = text.match(global);
    if (hits) {
      problems.push(`${file.replace(ROOT + '/', '')}: "${hits[0]}" ×${hits.length} → use "${rule.right}" (${rule.ruling})`);
    }
  }
}

if (problems.length) {
  for (const p of problems) console.error(`error: ${p}`);
  console.error(`\n${problems.length} ruled-out Digo form(s). See context/language-standards/README.md.`);
  process.exit(1);
}
console.log(`digo standards: ${RULED_OUT.length} ruled-out forms, none found`);
