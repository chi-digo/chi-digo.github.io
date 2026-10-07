// Fails the build if any quiz question lacks four distinct, non-empty options
// in every locale, or has an answer index outside them.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Tri = { e: string[]; s: string[]; d: string[] };
interface Question { id: string; opts: Tri; ans: number }

const file = join(process.cwd(), 'public', 'data', 'quiz', 'quiz-bank.json');
const bank = JSON.parse(readFileSync(file, 'utf-8'));
const norm = (s: string) => (s ?? '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();

const problems: string[] = [];
let total = 0;
for (const cat of Object.values(bank.questions) as Record<string, Question[]>[]) {
  for (const qs of Object.values(cat)) {
    for (const q of qs) {
      total++;
      if (!(q.ans >= 0 && q.ans < 4)) problems.push(`${q.id}: answer index ${q.ans}`);
      for (const lk of ['e', 's', 'd'] as const) {
        const opts = q.opts[lk] ?? [];
        if (opts.length !== 4) problems.push(`${q.id} [${lk}]: ${opts.length} options`);
        if (opts.some(o => !norm(o))) problems.push(`${q.id} [${lk}]: empty option`);
        if (new Set(opts.map(norm)).size !== opts.length) problems.push(`${q.id} [${lk}]: duplicate options`);
      }
    }
  }
}

if (problems.length) {
  console.error(`Quiz bank invalid (${problems.length} problems):\n` + problems.slice(0, 50).join('\n'));
  process.exit(1);
}
console.log(`Quiz bank OK: ${total} questions, 4 distinct options each.`);
