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

// The current bank, then older banks so rounds played before a regeneration
// can still be turned into challenges (current IDs carry a version prefix and never collide).
// Literal paths so the deploy's file tracing bundles both files.
const BANK_PATHS = [
  join(process.cwd(), 'public', 'data', 'quiz', 'quiz-bank.json'),
  join(process.cwd(), 'public', 'data', 'quiz', 'quiz-bank-v2.json'),
];

let cached: Map<string, QuizBankQuestion> | null = null;

export async function getQuizBankMap(): Promise<Map<string, QuizBankQuestion>> {
  if (cached) return cached;

  const map = new Map<string, QuizBankQuestion>();
  for (const filePath of BANK_PATHS) {
    let raw: string;
    try {
      raw = await readFile(filePath, 'utf-8');
    } catch {
      continue;
    }
    const bank: QuizBank = JSON.parse(raw);
    for (const cat of Object.values(bank.questions)) {
      for (const diff of Object.values(cat)) {
        for (const q of diff) {
          if (!map.has(q.id)) map.set(q.id, q);
        }
      }
    }
  }

  cached = map;
  return map;
}

export type { QuizBankQuestion };
