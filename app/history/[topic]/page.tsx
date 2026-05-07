import type { Metadata } from 'next';
import { HistoryTopicArticle } from '@/components/HistoryArticle/HistoryArticle';
import { historyDomain } from '@/lib/history/content';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';

export function generateStaticParams() {
  return historyDomain.topics.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const t = historyDomain.topics.find((x) => x.slug === topic);
  if (!t) {
    return buildMetadata({ title: 'History', path: `/history/${topic}` });
  }
  return buildMetadata({
    title: `${t.title.en} | Digo History`,
    description: t.intro.en,
    path: `/history/${topic}`,
    type: 'article',
    section: 'History',
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
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
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'History', href: '/history' },
              { name: t.title.en, href: `/history/${topic}` },
            ])}
          />
        </>
      )}
      <HistoryTopicArticle topicSlug={topic} />
    </>
  );
}
