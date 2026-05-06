import { DomainIndex } from '@/components/CultureIndex/CultureIndex';
import { domains } from '@/lib/culture/content';

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  return <DomainIndex domainSlug={domain} />;
}
