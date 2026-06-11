import type { Metadata } from 'next';
import { DomainIndex } from '@/components/CultureIndex/CultureIndex';
import { domains } from '@/lib/culture/content';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';

export function generateStaticParams() {
  return domains.map((d) => ({ locale: 'en', domain: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; domain: string }>;
}): Promise<Metadata> {
  const { locale, domain } = await params;
  const d = domains.find((x) => x.slug === domain);
  if (!d) {
    return buildMetadata({ title: 'Culture', path: `/culture/${domain}`, locale: locale as Locale });
  }
  return buildMetadata({
    title: `${d.title.en} | Digo Culture`,
    description: d.intro.en,
    path: `/culture/${domain}`,
    locale: locale as Locale,
    type: 'article',
    section: 'Culture',
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  return <DomainIndex domainSlug={domain} />;
}
