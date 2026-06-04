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

let cached: Map<string, QuizBankQuestion> | null = null;

export async function getQuizBankMap(): Promise<Map<string, QuizBankQuestion>> {
  if (cached) return cached;

  const filePath = join(process.cwd(), 'public', 'data', 'quiz', 'quiz-bank.json');
  const raw = await readFile(filePath, 'utf-8');
  const bank: QuizBank = JSON.parse(raw);

  const map = new Map<string, QuizBankQuestion>();
  for (const cat of Object.values(bank.questions)) {
    for (const diff of Object.values(cat)) {
      for (const q of diff) {
        map.set(q.id, q);
      }
    }
  }

  cached = map;
  return map;
}

export type { QuizBankQuestion };
