import { LanguageTopicArticle } from '@/components/LanguageArticle/LanguageArticle';
import { oralTraditionsDomain } from '@/lib/language/content';

export function generateStaticParams() {
  return oralTraditionsDomain.topics.map((t) => ({ topic: t.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  return <LanguageTopicArticle topicSlug={topic} />;
}
