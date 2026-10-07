import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface QuizBankQuestion {
  id: string;
  q: { e: string; s: string; d: string };
  opts: { e: string[]; s: string[]; d: string[] };
  ans: number;
  exp: { e: string; s: string; d: string };
  cat: 'vocabulary' | 'proverbs' | 'riddles';
  dif: 'easy' | 'medium' | 'hard';
}

interface QuizBank {
  questions: {
    vocabulary: { easy: QuizBankQuestion[]; medium: QuizBankQuestion[]; hard: QuizBankQuestion[] };
    proverbs: { easy: QuizBankQuestion[]; medium: QuizBankQuestion[]; hard: QuizBankQuestion[] };
    riddles: { easy: QuizBankQuestion[]; medium: QuizBankQuestion[]; hard: QuizBankQuestion[] };
  };
}

// The current bank first, then every bank that was live before it, so a round
// played on an older bank can still become a challenge. Older banks reused IDs
// for different questions, so callers pick the version the player actually saw
// (see pickQuestion). Each file is read with a literal path so the deploy's
// file tracing bundles exactly these files.
async function readBanks(): Promise<string[]> {
  const read = (p: Promise<string>) => p.catch(() => null);
  const files = await Promise.all([
    read(readFile(join(process.cwd(), 'public', 'data', 'quiz', 'quiz-bank.json'), 'utf-8')),
    read(readFile(join(process.cwd(), 'public', 'data', 'quiz', 'quiz-bank-v3.0.1.json'), 'utf-8')),
    read(readFile(join(process.cwd(), 'public', 'data', 'quiz', 'quiz-bank-v3.0.json'), 'utf-8')),
    read(readFile(join(process.cwd(), 'public', 'data', 'quiz', 'quiz-bank-v2.json'), 'utf-8')),
  ]);
  return files.filter((f): f is string => f !== null);
}

let cached: Map<string, QuizBankQuestion[]> | null = null;

/** Every known version of each question ID, newest bank first. */
export async function getQuizBankVersions(): Promise<Map<string, QuizBankQuestion[]>> {
  if (cached) return cached;

  const map = new Map<string, QuizBankQuestion[]>();
  for (const raw of await readBanks()) {
    const bank: QuizBank = JSON.parse(raw);
    for (const cat of Object.values(bank.questions)) {
      for (const diff of Object.values(cat)) {
        for (const q of diff) {
          const versions = map.get(q.id);
          if (versions) versions.push(q);
          else map.set(q.id, [q]);
        }
      }
    }
  }

  cached = map;
  return map;
}

/**
 * The version of a question the player actually saw, matched on the question
 * text and options saved with their answer; without a match, the newest version.
 */
export function pickQuestion(
  versions: QuizBankQuestion[] | undefined,
  shownText?: string | null,
  shownOptions?: unknown,
): QuizBankQuestion | undefined {
  if (!versions || versions.length === 0) return undefined;
  const optionTexts = Array.isArray(shownOptions)
    ? shownOptions.map((o) => (o && typeof o === 'object' && 'text' in o ? String((o as { text: unknown }).text) : String(o)))
    : null;
  const locales = ['e', 's', 'd'] as const;
  const matches = (v: QuizBankQuestion, withOptions: boolean) =>
    locales.some((lk) =>
      v.q[lk] === shownText &&
      (!withOptions || (optionTexts !== null && v.opts[lk].length === optionTexts.length && v.opts[lk].every((t, i) => t === optionTexts[i]))),
    );
  if (shownText) {
    return versions.find((v) => matches(v, true)) ?? versions.find((v) => matches(v, false)) ?? versions[0];
  }
  return versions[0];
}

export type { QuizBankQuestion };
