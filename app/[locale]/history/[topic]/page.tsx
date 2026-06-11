import type { Metadata } from 'next';
import { HistoryTopicArticle } from '@/components/HistoryArticle/HistoryArticle';
import { historyDomain } from '@/lib/history/content';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { JsonLd } from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';

export function generateStaticParams() {
  return historyDomain.topics.map((t) => ({ locale: 'en', topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}): Promise<Metadata> {
  const { locale, topic } = await params;
  const t = historyDomain.topics.find((x) => x.slug === topic);
  if (!t) {
    return buildMetadata({ title: 'History', path: `/history/${topic}`, locale: locale as Locale });
  }
  return buildMetadata({
    title: `${t.title.en} | Digo History`,
    description: t.intro.en,
    path: `/history/${topic}`,
    locale: locale as Locale,
    type: 'article',
    section: 'History',
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}) {
  const { locale, topic } = await params;
  const loc = locale as Locale;
  const t = historyDomain.topics.find((x) => x.slug === topic);
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {t && (
        <>
          <JsonLd
            data={articleJsonLd({
              title: t.title.en,
              description: t.intro.en,
              path: `/history/${topic}`,
              section: 'History',
              datePublished: today,
              dateModified: today,
              locale: loc,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'History', href: '/history' },
              { name: t.title.en, href: `/history/${topic}` },
            ], loc)}
          />
        </>
      )}
      <HistoryTopicArticle topicSlug={topic} />
    </>
  );
}
