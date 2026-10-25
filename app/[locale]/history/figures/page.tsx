import type { Metadata } from 'next';
import { existsSync } from 'fs';
import { join } from 'path';
import { FiguresIndex } from '@/components/FiguresIndex/FiguresIndex';
import { publishedFigureSlugs } from '@/lib/articles/load';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Notable Digo Figures | Digo History',
    description:
      'Kaya elders, Kubo rulers, imams, teachers and a poet: the people who shaped Digo history in Kenya and Tanzania, each told in Chidigo, Kiswahili and English.',
    path: '/history/figures',
    locale: locale as Locale,
  });
}

/** Pencil scene impressions (public/images/hero/figures-<slug>.webp), where one exists. */
function scenes(slugs: string[]) {
  return Object.fromEntries(
    slugs
      .map((slug) => [slug, `/images/hero/figures-${slug}.webp`] as const)
      .filter(([, file]) => existsSync(join(process.cwd(), 'public', file))),
  );
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const slugs = publishedFigureSlugs();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', href: '/' },
          { name: 'History', href: '/history' },
          { name: 'Notable Figures', href: '/history/figures' },
        ], locale as Locale)}
      />
      <FiguresIndex published={slugs} scenes={scenes(slugs)} />
    </>
  );
}
