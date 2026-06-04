import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: challenges, error, count } = await supabase
    .from('challenges')
    .select('id, short_code, score, total, status, created_at', { count: 'exact' })
    .eq('challenger_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const challengeIds = (challenges ?? []).map((c) => c.id);
  const countsMap: Record<string, number> = {};

  if (challengeIds.length > 0) {
    const service = createServiceClient();
    const { data: completions } = await service
      .from('challenge_completions')
      .select('challenge_id')
      .in('challenge_id', challengeIds);

    for (const c of completions ?? []) {
      countsMap[c.challenge_id] = (countsMap[c.challenge_id] ?? 0) + 1;
    }
  }

  const totalCount = count ?? 0;

  return NextResponse.json({
    challenges: (challenges ?? []).map((c) => ({
      ...c,
      completions_count: countsMap[c.id] ?? 0,
    })),
    has_more: totalCount > from + pageSize,
  });
}
