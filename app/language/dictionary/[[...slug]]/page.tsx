import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { DIGO_ALPHABET } from '@/lib/constants';
import { DictionaryClient } from './DictionaryClient';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/JsonLd';
import {
  definedTermJsonLd,
  definedTermSetJsonLd,
  faqJsonLd,
  breadcrumbJsonLd,
} from '@/lib/seo/jsonld';
import type { LetterFile } from '@/lib/dictionary/types';

function getAllHeadwords(): string[] {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const headwords: string[] = [];

  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith('.json') || file.endsWith('.idx.json')) continue;
    if (file === 'corpus-to-dict.json' || file === 'fuzzy-rules.json') continue;
    if (file === 'index.json' || file === 'reverse-en.json') continue;

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

function findEntry(headword: string) {
  const dataDir = path.join(process.cwd(), 'public', 'data');

  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith('.json') || file.endsWith('.idx.json')) continue;
    if (file === 'corpus-to-dict.json' || file === 'fuzzy-rules.json') continue;
    if (file === 'index.json' || file === 'reverse-en.json') continue;

    const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const data: LetterFile = JSON.parse(raw);
    if (data && Array.isArray(data.entries)) {
      const entry = data.entries.find(
        (e) => e.headword.replace(/[\d;]+$/, '') === headword,
      );
      if (entry) return entry;
    }
  }
  return null;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Dictionary home
  if (!slug || slug.length === 0) {
    return buildMetadata({
      title: 'Chidigo Dictionary',
      description:
        'The largest searchable Chidigo dictionary — 5,200+ entries with definitions in Chidigo, Swahili, and English. Browse by letter or search.',
      path: '/language/dictionary',
    });
  }

  // Letter page: /dictionary/letter/a
  if (slug[0] === 'letter' && slug[1]) {
    const letter = decodeURIComponent(slug[1]).toUpperCase();
    return buildMetadata({
      title: `${letter} — Chidigo Dictionary`,
      description: `Browse Chidigo dictionary words starting with "${letter}" — definitions in Chidigo, Swahili, and English.`,
      path: `/language/dictionary/letter/${slug[1]}`,
    });
  }

  // Word page: /dictionary/word/mnazi
  if (slug[0] === 'word' && slug[1]) {
    const headword = decodeURIComponent(slug[1]);
    const entry = findEntry(headword);
    if (entry) {
      const firstDef = entry.senses[0]?.definition_en || entry.equivalents_en.join(', ');
      return buildMetadata({
        title: `${headword} — Chidigo Dictionary`,
        description: `${headword} (${entry.pos_en}): ${firstDef}. Trilingual Chidigo dictionary entry with definitions in Chidigo, Swahili, and English.`,
        path: `/language/dictionary/word/${encodeURIComponent(headword)}`,
      });
    }
    return buildMetadata({
      title: `${headword} — Chidigo Dictionary`,
      path: `/language/dictionary/word/${encodeURIComponent(headword)}`,
    });
  }

  return buildMetadata({
    title: 'Chidigo Dictionary',
    path: '/language/dictionary',
  });
}

const dictionaryFaq = faqJsonLd([
  {
    question: 'How many words are in the Chidigo dictionary?',
    answer:
      'The Chi-digo dictionary contains over 5,200 entries, making it the largest searchable digital dictionary for the Chidigo (Digo) language. Each entry includes definitions in three languages: Chidigo, Swahili, and English.',
  },
  {
    question: 'What languages are the dictionary definitions in?',
    answer:
      'Every dictionary entry provides definitions in three languages: Chidigo (the Digo language itself), Swahili (the regional lingua franca), and English. Many entries also include example sentences in all three languages.',
  },
  {
    question: 'How is the Digo alphabet different from the English alphabet?',
    answer:
      'The Digo (Chidigo) alphabet has 34 letters, including digraphs and trigraphs not found in English: Ch, Dz, Gbw, Kpw, Ndz, Ng, Ng\', Ph, Sh, and Ts. The apostrophe in M\' and Ng\' indicates distinct sounds. The letters C, Q, and X do not appear in the Digo alphabet.',
  },
]);

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  // Dictionary home — include DefinedTermSet + FAQ JSON-LD
  if (!slug || slug.length === 0) {
    return (
      <>
        <JsonLd data={definedTermSetJsonLd()} />
        <JsonLd data={dictionaryFaq} />
        <DictionaryClient />
      </>
    );
  }

  // Word page — include DefinedTerm JSON-LD
  if (slug[0] === 'word' && slug[1]) {
    const headword = decodeURIComponent(slug[1]);
    const entry = findEntry(headword);
    if (entry) {
      const firstDef = entry.senses[0]?.definition_en || entry.equivalents_en.join(', ');
      return (
        <>
          <JsonLd
            data={definedTermJsonLd({
              term: headword,
              definition: firstDef,
              pos: entry.pos_en,
              path: `/language/dictionary/word/${encodeURIComponent(headword)}`,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Dictionary', href: '/language/dictionary' },
              { name: headword, href: `/language/dictionary/word/${encodeURIComponent(headword)}` },
            ])}
          />
          <DictionaryClient />
        </>
      );
    }
  }

  return <DictionaryClient />;
}
