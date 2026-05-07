import fs from 'fs';
import path from 'path';
import { DIGO_ALPHABET } from '@/lib/constants';
import { DictionaryClient } from './DictionaryClient';

function getAllHeadwords(): string[] {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const headwords: string[] = [];

  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith('.json') || file.endsWith('.idx.json')) continue;
    if (file === 'corpus-to-dict.json' || file === 'fuzzy-rules.json') continue;

    const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && Array.isArray(data.entries)) {
      for (const entry of data.entries) {
        if (entry.headword) {
          headwords.push(entry.headword.replace(/[\d;]+$/, ''));
        }
      }
    }
  }

  return [...new Set(headwords)];
}

export function generateStaticParams() {
  const headwords = getAllHeadwords();

  return [
    { slug: [] },
    ...DIGO_ALPHABET.map((letter) => ({
      slug: ['letter', letter.toLowerCase()],
    })),
    ...headwords.map((word) => ({
      slug: ['word', word],
    })),
  ];
}

export default async function DictionaryPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return <DictionaryClient slug={slug ?? []} />;
}
