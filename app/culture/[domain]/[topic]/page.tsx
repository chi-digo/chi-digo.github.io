import type { Metadata } from 'next';
import { TopicArticle } from '@/components/CultureArticle/CultureArticle';
import { domains } from '@/lib/culture/content';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';

export function generateStaticParams() {
  return domains.flatMap((d) =>
    d.topics.map((t) => ({ domain: d.slug, topic: t.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; topic: string }>;
}): Promise<Metadata> {
  const { domain, topic } = await params;
  const d = domains.find((x) => x.slug === domain);
  const t = d?.topics.find((x) => x.slug === topic);
  if (!d || !t) {
    return buildMetadata({ title: 'Culture', path: `/culture/${domain}/${topic}` });
  }
  return buildMetadata({
    title: `${t.title.en} | ${d.title.en}`,
    description: t.intro.en,
    path: `/culture/${domain}/${topic}`,
    type: 'article',
    section: d.title.en,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ domain: string; topic: string }>;
}) {
  const { domain, topic } = await params;
  const d = domains.find((x) => x.slug === domain);
  const t = d?.topics.find((x) => x.slug === topic);
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
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Culture', href: '/culture' },
              { name: d.title.en, href: `/culture/${domain}` },
              { name: t.title.en, href: `/culture/${domain}/${topic}` },
            ])}
          />
        </>
      )}
      <TopicArticle domainSlug={domain} topicSlug={topic} />
    </>
  );
}
