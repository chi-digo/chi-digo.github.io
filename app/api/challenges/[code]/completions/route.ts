import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit } from '@/lib/challenge/rate-limit';
import { resolveChallengerIdentity } from '@/lib/challenge/resolve-identity';
import { headers } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? 'unknown';

  if (!rateLimit(ip, 60)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();

  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('id, challenger_id, score, total, created_at')
    .eq('short_code', code)
    .single();

  if (error || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  let challenger = { display_name: null as string | null, avatar_url: null as string | null, score: challenge.score };

  if (challenge.challenger_id) {
    const service = createServiceClient();
    const identity = await resolveChallengerIdentity(service, challenge.challenger_id);
    challenger = { ...identity, score: challenge.score };
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const service = createServiceClient();
  const { data: completions, error: cError, count } = await service
    .from('challenge_completions')
    .select('id, display_name, avatar_url, score, time_taken_ms, completed_at', { count: 'exact' })
    .eq('challenge_id', challenge.id)
    .order('score', { ascending: false })
    .order('time_taken_ms', { ascending: true })
    .range(from, to);

  if (cError) {
    return NextResponse.json({ error: cError.message }, { status: 500 });
  }

  const totalCount = count ?? 0;

  return NextResponse.json({
    challenge: {
      id: challenge.id,
      challenger,
      score: challenge.score,
      total: challenge.total,
      created_at: challenge.created_at,
      completions_count: totalCount,
    },
    completions: completions ?? [],
    has_more: totalCount > from + pageSize,
  });
}
