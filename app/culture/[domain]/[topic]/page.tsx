import { TopicArticle } from '@/components/CultureArticle/CultureArticle';
import { domains } from '@/lib/culture/content';

export function generateStaticParams() {
  return domains.flatMap((d) =>
    d.topics.map((t) => ({ domain: d.slug, topic: t.slug })),
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ domain: string; topic: string }>;
}) {
  const { domain, topic } = await params;
  return <TopicArticle domainSlug={domain} topicSlug={topic} />;
}
