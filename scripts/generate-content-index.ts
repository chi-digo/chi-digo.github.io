import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { domains } from '../lib/culture/content';
import { historyDomain } from '../lib/history/content';
import { oralTraditionsDomain } from '../lib/language/content';
import type { Locale } from '../lib/i18n/config';

type ContentIndexEntry = {
  slug: string;
  section: 'culture' | 'history' | 'language';
  domain?: string;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  keywords: string[];
  digo_terms: string[];
};

const DIGO_TERM_RE = /\{dig:([^}]+)\}/g;

function extractDigoTerms(blocks: { type: string; text: string }[]): string[] {
  const terms = new Set<string>();
  for (const block of blocks) {
    let match: RegExpExecArray | null;
    DIGO_TERM_RE.lastIndex = 0;
    while ((match = DIGO_TERM_RE.exec(block.text)) !== null) {
      terms.add(match[1].toLowerCase());
    }
  }
  return [...terms];
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

const entries: ContentIndexEntry[] = [];

for (const domain of domains) {
  for (const topic of domain.topics) {
    const digoTerms = [
      ...extractDigoTerms(topic.body.en || []),
      ...extractDigoTerms(topic.body.sw || []),
      ...extractDigoTerms(topic.body.dig || []),
    ];

    const keywords = [
      domain.title.en.toLowerCase(),
      domain.title.sw.toLowerCase(),
      domain.title.dig.toLowerCase(),
      topic.title.en.toLowerCase(),
      topic.title.sw.toLowerCase(),
      topic.title.dig.toLowerCase(),
    ];

    entries.push({
      slug: `${domain.slug}/${topic.slug}`,
      section: 'culture',
      domain: domain.slug,
      title: topic.title,
      intro: {
        en: truncate(topic.intro.en, 200),
        sw: truncate(topic.intro.sw, 200),
        dig: truncate(topic.intro.dig, 200),
      },
      keywords: [...new Set(keywords)],
      digo_terms: [...new Set(digoTerms)],
    });
  }
}

for (const topic of historyDomain.topics) {
  const digoTerms = [
    ...extractDigoTerms(topic.body.en || []),
    ...extractDigoTerms(topic.body.sw || []),
    ...extractDigoTerms(topic.body.dig || []),
  ];

  entries.push({
    slug: topic.slug,
    section: 'history',
    title: topic.title,
    intro: {
      en: truncate(topic.intro.en, 200),
      sw: truncate(topic.intro.sw, 200),
      dig: truncate(topic.intro.dig, 200),
    },
    keywords: [
      historyDomain.title.en.toLowerCase(),
      topic.title.en.toLowerCase(),
      topic.title.sw.toLowerCase(),
      topic.title.dig.toLowerCase(),
    ],
    digo_terms: [...new Set(digoTerms)],
  });
}

for (const topic of oralTraditionsDomain.topics) {
  const digoTerms = [
    ...extractDigoTerms(topic.body.en || []),
    ...extractDigoTerms(topic.body.sw || []),
    ...extractDigoTerms(topic.body.dig || []),
  ];

  entries.push({
    slug: topic.slug,
    section: 'language',
    title: topic.title,
    intro: {
      en: truncate(topic.intro.en, 200),
      sw: truncate(topic.intro.sw, 200),
      dig: truncate(topic.intro.dig, 200),
    },
    keywords: [
      oralTraditionsDomain.title.en.toLowerCase(),
      topic.title.en.toLowerCase(),
      topic.title.sw.toLowerCase(),
      topic.title.dig.toLowerCase(),
    ],
    digo_terms: [...new Set(digoTerms)],
  });
}

const outDir = join(process.cwd(), 'public', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'content-index.json'), JSON.stringify(entries, null, 2));

console.log(`Generated content-index.json with ${entries.length} entries`);
