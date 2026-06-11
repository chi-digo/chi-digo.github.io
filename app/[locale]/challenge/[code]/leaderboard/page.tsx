import { LeaderboardPage } from './LeaderboardPage';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export default async function Page({ params }: Props) {
  const { code } = await params;
  return <LeaderboardPage code={code} />;
}
