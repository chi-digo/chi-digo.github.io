import type { Metadata } from 'next';
import { LanguageTopicArticle } from '@/components/LanguageArticle/LanguageArticle';
import { oralTraditionsDomain } from '@/lib/language/content';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { JsonLd } from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';

export function generateStaticParams() {
  return oralTraditionsDomain.topics.map((t) => ({ locale: 'en', topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}): Promise<Metadata> {
  const { locale, topic } = await params;
  const t = oralTraditionsDomain.topics.find((x) => x.slug === topic);
  if (!t) {
    return buildMetadata({ title: 'Language', path: `/language/${topic}`, locale: locale as Locale });
  }
  return buildMetadata({
    title: `${t.title.en} | Digo Language`,
    description: t.intro.en,
    path: `/language/${topic}`,
    locale: locale as Locale,
    type: 'article',
    section: 'Language',
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}) {
  const { locale, topic } = await params;
  const loc = locale as Locale;
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
              locale: loc,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Language', href: '/language' },
              { name: t.title.en, href: `/language/${topic}` },
            ], loc)}
          />
        </>
      )}
      <LanguageTopicArticle topicSlug={topic} />
    </>
  );
}
