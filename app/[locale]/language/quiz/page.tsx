import { buildMetadata } from '@/lib/seo/metadata';
import { QuizPage } from './QuizPage';

export const metadata = buildMetadata({
  title: 'Jaribu — Test Yourself | Digo Language',
  description:
    'Test your knowledge of Digo vocabulary, proverbs, and riddles with interactive quizzes. 10 questions per round with instant feedback.',
  path: '/language/quiz',
});

export default function Page() {
  return <QuizPage />;
}
