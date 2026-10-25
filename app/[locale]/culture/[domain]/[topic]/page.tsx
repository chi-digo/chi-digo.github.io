import type { Metadata } from 'next';
import { TopicArticle } from '@/components/CultureArticle/CultureArticle';
import { notFound } from 'next/navigation';
import { getDomain, getTopic, domains } from '@/lib/articles/manifest';
import { articleData } from '@/lib/articles/load';
import type { ArticleFile } from '@/lib/articles/types';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { JsonLd } from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';

export function generateStaticParams() {
  return domains.flatMap((d) =>
    d.topics.map((t) => ({ locale: 'en', domain: d.slug, topic: t.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; domain: string; topic: string }>;
}): Promise<Metadata> {
  const { locale, domain, topic } = await params;
  const d = getDomain(domain);
  const t = getTopic(domain, topic)?.topic;
  if (!d || !t) {
    return buildMetadata({ title: 'Culture', path: `/culture/${domain}/${topic}`, locale: locale as Locale });
  }
  return buildMetadata({
    title: `${t.title.en} | ${d.title.en}`,
    description: t.intro.en,
    path: `/culture/${domain}/${topic}`,
    locale: locale as Locale,
    type: 'article',
    section: d.title.en,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; domain: string; topic: string }>;
}) {
  const { locale, domain, topic } = await params;
  const loc = locale as Locale;
  const d = getDomain(domain);
  const t = getTopic(domain, topic)?.topic;
  const article = articleData(`culture/${domain}/${topic}`) as ArticleFile | null;
  if (!article) notFound();
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {d && t && (
        <>
          <JsonLd
            data={articleJsonLd({
              title: t.title.en,
              description: t.intro.en,
              path: `/culture/${domain}/${topic}`,
              section: d.title.en,
              datePublished: today,
              dateModified: today,
              locale: loc,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Culture', href: '/culture' },
              { name: d.title.en, href: `/culture/${domain}` },
              { name: t.title.en, href: `/culture/${domain}/${topic}` },
            ], loc)}
          />
        </>
      )}
      <TopicArticle domainSlug={domain} topicSlug={topic} article={article} />
    </>
  );
}
