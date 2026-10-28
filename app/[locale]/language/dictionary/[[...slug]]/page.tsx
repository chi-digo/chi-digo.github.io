import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { DIGO_ALPHABET } from '@/lib/constants';
import { DictionaryClient } from './DictionaryClient';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { JsonLd } from '@/components/JsonLd';
import {
  definedTermJsonLd,
  definedTermSetJsonLd,
  faqJsonLd,
  breadcrumbJsonLd,
} from '@/lib/seo/jsonld';
import type { DictionaryEntry, LetterFile } from '@/lib/dictionary/types';
import { formerHeadwords } from '@/lib/contributions/apply/words';

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

/** Headwords match without digits glued on, case, or a leading "-" (as the client's lookup does). */
const bare = (h: string) => h.replace(/[\d;]+$/, '').replace(/^-/, '').toLowerCase();

/**
 * The entry a word address shows: one whose headword it is, in any letter file; else one that used to
 * have that headword (spec 34 §18.5: the old address keeps showing the entry, as a former headword).
 */
function findEntry(headword: string): { entry: DictionaryEntry; former: boolean } | null {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const files: LetterFile[] = [];
  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith('.json') || file.endsWith('.idx.json')) continue;
    if (file === 'corpus-to-dict.json' || file === 'fuzzy-rules.json') continue;
    if (file === 'index.json' || file === 'reverse-en.json') continue;

    const data: LetterFile = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
    if (data && Array.isArray(data.entries)) files.push(data);
  }
  const key = bare(headword);
  for (const data of files) {
    const entry = data.entries.find((e) => bare(e.headword) === key);
    if (entry) return { entry, former: false };
  }
  for (const data of files) {
    const entry = data.entries.find((e) => formerHeadwords(e).some((v) => bare(v.form) === key));
    if (entry) return { entry, former: true };
  }
  return null;
}

export function generateStaticParams() {
  const headwords = getAllHeadwords();

  return [
    { locale: 'en', slug: [] },
    ...DIGO_ALPHABET.map((letter) => ({
      locale: 'en',
      slug: ['letter', letter.toLowerCase()],
    })),
    ...headwords.map((word) => ({
      locale: 'en',
      slug: ['word', word],
    })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as Locale;

  if (!slug || slug.length === 0) {
    return buildMetadata({
      title: 'Chidigo Dictionary',
      description:
        'The largest searchable Chidigo dictionary — 5,200+ entries with definitions in Chidigo, Swahili, and English. Browse by letter or search.',
      path: '/language/dictionary',
      locale: loc,
    });
  }

  if (slug[0] === 'letter' && slug[1]) {
    const letter = decodeURIComponent(slug[1]).toUpperCase();
    return buildMetadata({
      title: `${letter} — Chidigo Dictionary`,
      description: `Browse Chidigo dictionary words starting with "${letter}" — definitions in Chidigo, Swahili, and English.`,
      path: `/language/dictionary/letter/${slug[1]}`,
      locale: loc,
    });
  }

  if (slug[0] === 'word' && slug[1]) {
    const headword = decodeURIComponent(slug[1]);
    const found = findEntry(headword);
    if (found?.former) {
      // The old address of a renamed entry: it shows the entry, under its current headword, which is the
      // one address search engines should index.
      const { entry } = found;
      const firstDef = entry.senses[0]?.definition_en || entry.equivalents_en.join(', ');
      return buildMetadata({
        title: `${entry.headword} — Chidigo Dictionary`,
        description: `${entry.headword} (${entry.pos_en}): ${firstDef}. Trilingual Chidigo dictionary entry with definitions in Chidigo, Swahili, and English.`,
        path: `/language/dictionary/word/${encodeURIComponent(entry.headword)}`,
        locale: loc,
        noindex: true,
      });
    }
    const entry = found?.entry;
    if (entry) {
      const firstDef = entry.senses[0]?.definition_en || entry.equivalents_en.join(', ');
      return buildMetadata({
        title: `${headword} — Chidigo Dictionary`,
        description: `${headword} (${entry.pos_en}): ${firstDef}. Trilingual Chidigo dictionary entry with definitions in Chidigo, Swahili, and English.`,
        path: `/language/dictionary/word/${encodeURIComponent(headword)}`,
        locale: loc,
      });
    }
    // Not in the shipped data (unknown, or a community word not folded in yet): keep it out of search (spec 34 §15.3).
    return buildMetadata({
      title: `${headword} — Chidigo Dictionary`,
      path: `/language/dictionary/word/${encodeURIComponent(headword)}`,
      locale: loc,
      noindex: true,
    });
  }

  return buildMetadata({
    title: 'Chidigo Dictionary',
    path: '/language/dictionary',
    locale: loc,
  });
}

const dictionaryFaq = faqJsonLd([
  {
    question: 'How many words are in the Chidigo dictionary?',
    answer:
      'The Chidigo dictionary contains over 5,200 entries, making it the largest searchable digital dictionary for the Chidigo (Digo) language. Each entry includes definitions in three languages: Chidigo, Swahili, and English.',
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
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as Locale;

  if (!slug || slug.length === 0) {
    return (
      <>
        <JsonLd data={definedTermSetJsonLd()} />
        <JsonLd data={dictionaryFaq} />
        <DictionaryClient />
      </>
    );
  }

  if (slug[0] === 'word' && slug[1]) {
    const headword = decodeURIComponent(slug[1]);
    const found = findEntry(headword);
    const entry = found && !found.former ? found.entry : null;
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
              locale: loc,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Dictionary', href: '/language/dictionary' },
              { name: headword, href: `/language/dictionary/word/${encodeURIComponent(headword)}` },
            ], loc)}
          />
          <DictionaryClient />
        </>
      );
    }
  }

  return <DictionaryClient />;
}
