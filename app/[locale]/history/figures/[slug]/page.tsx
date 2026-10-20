import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FigureArticle } from '@/components/FigureArticle/FigureArticle';
import { figures } from '@/lib/history/figures';
import { loadFigureArticles, publishedFigureSlugs } from '@/lib/history/figure-articles';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';

// Only figures whose article exists in all three languages get a page.
export const dynamicParams = false;

export function generateStaticParams() {
  return publishedFigureSlugs().map((slug) => ({ locale: 'en', slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const f = figures.find((x) => x.slug === slug);
  return buildMetadata({
    title: f ? `${f.name} | Digo History` : 'Digo History',
    description: f?.summary.en,
    path: `/history/figures/${slug}`,
    locale: locale as Locale,
    type: 'article',
    section: 'History',
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const figure = figures.find((x) => x.slug === slug);
  const articles = figure ? loadFigureArticles(slug) : null;
  if (!figure || !articles) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', href: '/' },
          { name: 'History', href: '/history' },
          { name: figure.name, href: `/history/figures/${slug}` },
        ], locale as Locale)}
      />
      <FigureArticle figure={figure} articles={articles} />
    </>
  );
}
