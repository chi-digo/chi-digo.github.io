import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/config';
import { QuizPage } from './QuizPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: 'Jaribu — Test Yourself | Digo Language',
    description:
      'Test your knowledge of Digo vocabulary, proverbs, and riddles with interactive quizzes. 10 questions per round with instant feedback.',
    path: '/language/quiz',
    locale: locale as Locale,
  });
}

export default function Page() {
  return <QuizPage />;
}
