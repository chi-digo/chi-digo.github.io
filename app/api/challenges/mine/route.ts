import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('id, short_code, score, total, status, created_at')
    .eq('challenger_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get completion counts for each challenge
  const challengeIds = (challenges ?? []).map((c) => c.id);
  const countsMap: Record<string, number> = {};

  if (challengeIds.length > 0) {
    const { data: completions } = await supabase
      .from('challenge_completions')
      .select('challenge_id')
      .in('challenge_id', challengeIds);

    for (const c of completions ?? []) {
      countsMap[c.challenge_id] = (countsMap[c.challenge_id] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    challenges: (challenges ?? []).map((c) => ({
      ...c,
      completions_count: countsMap[c.id] ?? 0,
    })),
  });
}
