import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/challenge/rate-limit';
import { headers } from 'next/headers';

export async function GET(
  _request: Request,
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
    .select(`
      id,
      short_code,
      challenger_id,
      score,
      total,
      category_breakdown,
      difficulty_distribution,
      time_taken_ms,
      status,
      created_at
    `)
    .eq('short_code', code)
    .single();

  if (error || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  let challenger: { display_name: string | null; avatar_url: string | null } = {
    display_name: null,
    avatar_url: null,
  };

  if (challenge.challenger_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', challenge.challenger_id)
      .single();

    if (profile) {
      challenger = { display_name: profile.display_name, avatar_url: null };
    }
  }

  const { count } = await supabase
    .from('challenge_completions')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challenge.id);

  return NextResponse.json({
    id: challenge.id,
    short_code: challenge.short_code,
    challenger,
    score: challenge.score,
    total: challenge.total,
    category_breakdown: challenge.category_breakdown,
    difficulty_distribution: challenge.difficulty_distribution,
    time_taken_ms: challenge.time_taken_ms,
    status: challenge.status,
    created_at: challenge.created_at,
    completions_count: count ?? 0,
  });
}
