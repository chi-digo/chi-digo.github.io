import type { Metadata } from 'next';
import { ProverbsClient } from './ProverbsClient';
import { buildMetadata } from '@/lib/seo/metadata';

export function generateStaticParams() {
  return [
    { slug: [] },
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
        '349 Digo proverbs with translations in Chidigo, Swahili, and English. Browse by theme, search, and explore cultural commentary.',
      path: '/proverbs',
    });
  }

  if (slug[0] === 'theme' && slug[1]) {
    const theme = decodeURIComponent(slug[1]);
    const label = theme.charAt(0).toUpperCase() + theme.slice(1);
    return buildMetadata({
      title: `${label} — Chidigo Proverbs`,
      description: `Digo proverbs about ${theme} — with translations and cultural commentary in Chidigo, Swahili, and English.`,
      path: `/proverbs/theme/${slug[1]}`,
    });
  }

  if (slug[0] === 'letter' && slug[1]) {
    const letter = decodeURIComponent(slug[1]).toUpperCase();
    return buildMetadata({
      title: `${letter} — Chidigo Proverbs`,
      description: `Digo proverbs starting with "${letter}" — with translations and cultural commentary.`,
      path: `/proverbs/letter/${slug[1]}`,
    });
  }

  if (slug[0]?.startsWith('p-')) {
    const proverbSlug = decodeURIComponent(slug[0]);
    return buildMetadata({
      title: `Proverb — Chidigo Proverbs`,
      description: `A Digo proverb with literal and idiomatic translations, cultural commentary, and thematic connections.`,
      path: `/proverbs/${proverbSlug}`,
    });
  }

  return buildMetadata({
    title: 'Chidigo Proverbs',
    path: '/proverbs',
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
