import { ContactPage } from '@/components/ContactPage/ContactPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Contact',
  description:
    'Get in touch with the Chi-digo project — questions, contributions, and collaboration on Digo language and cultural resources.',
  path: '/contact',
});

export default function Page() {
  return <ContactPage />;
}
