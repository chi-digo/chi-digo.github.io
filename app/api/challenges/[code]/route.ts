import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit } from '@/lib/challenge/rate-limit';
import { resolveChallengerIdentity } from '@/lib/challenge/resolve-identity';
import { headers } from 'next/headers';

const ANON_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const url = new URL(request.url);
  const anonymousId = url.searchParams.get('anonymous_id');
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? 'unknown';

  if (!rateLimit(ip, 60)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();

  const { data: challenge, error } = await supabase
    .from('challenges')
    .select(`
      id,
      short_code,
      challenger_id,
      score,
      total,
      category_breakdown,
      difficulty_distribution,
      time_taken_ms,
      created_at
    `)
    .eq('short_code', code)
    .single();

  if (error || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  let challenger = { display_name: null as string | null, avatar_url: null as string | null };

  if (challenge.challenger_id) {
    const service = createServiceClient();
    challenger = await resolveChallengerIdentity(service, challenge.challenger_id);
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { count } = await supabase
    .from('challenge_completions')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challenge.id);

  let hasCompleted = false;
  if (user) {
    const { count: myCount } = await supabase
      .from('challenge_completions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id);
    hasCompleted = (myCount ?? 0) > 0;
  } else if (anonymousId && ANON_ID_RE.test(anonymousId)) {
    const service = createServiceClient();
    const { count: anonCount } = await service
      .from('challenge_completions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)
      .eq('anonymous_id', anonymousId);
    hasCompleted = (anonCount ?? 0) > 0;
  }

  return NextResponse.json({
    id: challenge.id,
    short_code: challenge.short_code,
    challenger,
    score: challenge.score,
    total: challenge.total,
    category_breakdown: challenge.category_breakdown,
    difficulty_distribution: challenge.difficulty_distribution,
    time_taken_ms: challenge.time_taken_ms,
    created_at: challenge.created_at,
    completions_count: count ?? 0,
    is_owner: user?.id === challenge.challenger_id,
    has_completed: hasCompleted,
  });
}
