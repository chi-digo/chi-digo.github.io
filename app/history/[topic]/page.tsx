import { HistoryTopicArticle } from '@/components/HistoryArticle/HistoryArticle';
import { historyDomain } from '@/lib/history/content';

export function generateStaticParams() {
  return historyDomain.topics.map((t) => ({ topic: t.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  return <HistoryTopicArticle topicSlug={topic} />;
}
