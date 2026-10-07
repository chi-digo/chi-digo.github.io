import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProverbsClient } from './ProverbsClient';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { PROVERB_THEMES } from '@/lib/proverbs/themes';
import { DIGO_ALPHABET } from '@/lib/constants';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd, proverbCollectionJsonLd, proverbJsonLd } from '@/lib/seo/jsonld';

interface ProverbStub {
  slug: string;
  digo: string;
  literal_en: string;
  literal_sw?: string;
  idiomatic_en: string;
  idiomatic_sw?: string;
  idiomatic_dg?: string;
  themes?: string[];
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
    { locale: 'en', slug: [] },
    ...slugs.map((s) => ({ locale: 'en', slug: [s] })),
    ...PROVERB_THEMES.map((t) => ({ locale: 'en', slug: ['theme', t.slug] })),
    ...DIGO_ALPHABET.map((l) => ({ locale: 'en', slug: ['letter', l.toLowerCase()] })),
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
      title: 'Chidigo Proverbs',
      description:
        '387 Digo proverbs with translations in Chidigo, Swahili, and English. Browse by theme, search, and explore cultural commentary.',
      path: '/language/proverbs',
      locale: loc,
    });
  }

  if (slug[0] === 'theme' && slug[1]) {
    const theme = decodeURIComponent(slug[1]);
    const label = theme.charAt(0).toUpperCase() + theme.slice(1);
    return buildMetadata({
      title: `${label} — Chidigo Proverbs`,
      description: `Digo proverbs about ${theme} — with translations and cultural commentary in Chidigo, Swahili, and English.`,
      path: `/language/proverbs/theme/${slug[1]}`,
      locale: loc,
    });
  }

  if (slug[0] === 'letter' && slug[1]) {
    const letter = decodeURIComponent(slug[1]).toUpperCase();
    return buildMetadata({
      title: `${letter} — Chidigo Proverbs`,
      description: `Digo proverbs starting with "${letter}" — with translations and cultural commentary.`,
      path: `/language/proverbs/letter/${slug[1]}`,
      locale: loc,
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
      locale: loc,
    });
  }

  return buildMetadata({
    title: 'Chidigo Proverbs',
    path: '/language/proverbs',
    locale: loc,
  });
}

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
        <JsonLd data={proverbCollectionJsonLd(loadProverbStubs().length)} />
        <ProverbsClient />
      </>
    );
  }

  if (slug[0]?.startsWith('p-')) {
    const proverbSlug = decodeURIComponent(slug[0]);
    const found = loadProverbStubs().find((p) => p.slug === proverbSlug);
    if (found) {
      const meaning =
        (loc === 'sw' ? found.idiomatic_sw : loc === 'dg' ? found.idiomatic_dg : found.idiomatic_en) ||
        found.idiomatic_en;
      const literal = (loc === 'sw' ? found.literal_sw : found.literal_en) || found.literal_en;
      const path = `/language/proverbs/${encodeURIComponent(proverbSlug)}`;
      return (
        <>
          <JsonLd
            data={proverbJsonLd({ digo: found.digo, meaning, literal, themes: found.themes, path, locale: loc })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Proverbs', href: '/language/proverbs' },
              { name: found.digo, href: path },
            ], loc)}
          />
          <ProverbsClient />
        </>
      );
    }
  }

  return <ProverbsClient />;
}
