import type { Metadata } from 'next';
import { DomainIndex } from '@/components/CultureIndex/CultureIndex';
import { domains } from '@/lib/culture/content';
import { buildMetadata } from '@/lib/seo/metadata';

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const d = domains.find((x) => x.slug === domain);
  if (!d) {
    return buildMetadata({ title: 'Culture', path: `/culture/${domain}` });
  }
  return buildMetadata({
    title: `${d.title.en} | Digo Culture`,
    description: d.intro.en,
    path: `/culture/${domain}`,
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
