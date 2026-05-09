import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProverbsClient } from './ProverbsClient';
import { buildMetadata } from '@/lib/seo/metadata';
import { PROVERB_THEMES } from '@/lib/proverbs/themes';
import { DIGO_ALPHABET } from '@/lib/constants';

interface ProverbStub {
  slug: string;
  digo: string;
  literal_en: string;
  idiomatic_en: string;
}

let _proverbCache: ProverbStub[] | null = null;

function loadProverbStubs(): ProverbStub[] {
  if (_proverbCache) return _proverbCache;
  const raw = readFileSync(join(process.cwd(), 'public/data/proverbs/index.json'), 'utf-8');
  _proverbCache = JSON.parse(raw) as ProverbStub[];
  return _proverbCache;
}

function loadProverbSlugs(): string[] {
  return loadProverbStubs().map((p) => p.slug);
}

export function generateStaticParams() {
  const slugs = loadProverbSlugs();

  return [
    { slug: [] },
    ...slugs.map((s) => ({ slug: [s] })),
    ...PROVERB_THEMES.map((t) => ({ slug: ['theme', t.slug] })),
    ...DIGO_ALPHABET.map((l) => ({ slug: ['letter', l.toLowerCase()] })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return buildMetadata({
      title: 'Chidigo Proverbs',
      description:
        '378 Digo proverbs with translations in Chidigo, Swahili, and English. Browse by theme, search, and explore cultural commentary.',
      path: '/language/proverbs',
    });
  }

  if (slug[0] === 'theme' && slug[1]) {
    const theme = decodeURIComponent(slug[1]);
    const label = theme.charAt(0).toUpperCase() + theme.slice(1);
    return buildMetadata({
      title: `${label} — Chidigo Proverbs`,
      description: `Digo proverbs about ${theme} — with translations and cultural commentary in Chidigo, Swahili, and English.`,
      path: `/language/proverbs/theme/${slug[1]}`,
    });
  }

  if (slug[0] === 'letter' && slug[1]) {
    const letter = decodeURIComponent(slug[1]).toUpperCase();
    return buildMetadata({
      title: `${letter} — Chidigo Proverbs`,
      description: `Digo proverbs starting with "${letter}" — with translations and cultural commentary.`,
      path: `/language/proverbs/letter/${slug[1]}`,
    });
  }

  if (slug[0]?.startsWith('p-')) {
    const proverbSlug = decodeURIComponent(slug[0]);
    const stubs = loadProverbStubs();
    const found = stubs.find((p) => p.slug === proverbSlug);
    const title = found ? found.digo : 'Proverb';
    const desc = found
      ? (found.idiomatic_en || found.literal_en || 'A Digo proverb with translations and cultural commentary.')
      : 'A Digo proverb with literal and idiomatic translations, cultural commentary, and thematic connections.';
    return buildMetadata({
      title: `${title} — Chidigo Proverbs`,
      description: desc,
      path: `/language/proverbs/${proverbSlug}`,
    });
  }

  return buildMetadata({
    title: 'Chidigo Proverbs',
    path: '/language/proverbs',
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  await params;
  return <ProverbsClient />;
}
