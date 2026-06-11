import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ChallengePage } from './ChallengePage';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, challenger_id, score, total')
    .eq('short_code', code)
    .single();

  if (!challenge) {
    return { title: 'Challenge not found — Chidigo' };
  }

  let name = 'Mtu wa Chidigo';
  if (challenge.challenger_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', challenge.challenger_id)
      .single();
    if (profile?.display_name) name = profile.display_name;
  }

  const title = `${name} challenged you to a Chidigo quiz!`;
  const description = `They scored ${challenge.score}/${challenge.total}. Can you beat them?`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chidigo.org';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`${baseUrl}/api/og/challenge/${code}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { code } = await params;
  return <ChallengePage code={code} />;
}
