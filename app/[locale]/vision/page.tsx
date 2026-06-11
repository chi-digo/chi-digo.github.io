import { VisionPage } from '@/components/VisionPage/VisionPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Our Vision',
  description:
    'Our vision for Chidigo — a future where the Digo language thrives digitally, with comprehensive resources for learning, preservation, and cultural transmission.',
  path: '/vision',
});

export default function Page() {
  return <VisionPage />;
}
