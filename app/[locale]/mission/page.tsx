import { MissionPage } from '@/components/MissionPage/MissionPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Our Mission',
  description:
    'Our mission is to build the most comprehensive digital transmission tools for the Chidigo language — serving 600,000+ speakers on the Kenya–Tanzania coast.',
  path: '/mission',
});

export default function Page() {
  return <MissionPage />;
}
