import type { Metadata } from 'next';
import { LanguageTopicArticle } from '@/components/LanguageArticle/LanguageArticle';
import { oralTraditionsDomain } from '@/lib/language/content';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';

export function generateStaticParams() {
  return oralTraditionsDomain.topics.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const t = oralTraditionsDomain.topics.find((x) => x.slug === topic);
  if (!t) {
    return buildMetadata({ title: 'Language', path: `/language/${topic}` });
  }
  return buildMetadata({
    title: `${t.title.en} | Digo Language`,
    description: t.intro.en,
    path: `/language/${topic}`,
    type: 'article',
    section: 'Language',
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const t = oralTraditionsDomain.topics.find((x) => x.slug === topic);
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {t && (
        <>
          <JsonLd
            data={articleJsonLd({
              title: t.title.en,
              description: t.intro.en,
              path: `/language/${topic}`,
              section: 'Language',
              datePublished: today,
              dateModified: today,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Language', href: '/language' },
              { name: t.title.en, href: `/language/${topic}` },
            ])}
          />
        </>
      )}
      <LanguageTopicArticle topicSlug={topic} />
    </>
  );
}
