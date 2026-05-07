import { AboutPage } from '@/components/AboutPage/AboutPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'About Chi-digo',
  description:
    'Learn about Chi-digo, a language transmission project building dictionary, cultural, and educational resources for the Digo people and the Chidigo language.',
  path: '/about',
});

export default function Page() {
  return <AboutPage />;
}
