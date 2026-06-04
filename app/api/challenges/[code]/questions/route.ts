import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit } from '@/lib/challenge/rate-limit';
import { headers } from 'next/headers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? 'unknown';

  if (!rateLimit(ip, 20)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();

  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('id, status')
    .eq('short_code', code)
    .single();

  if (error || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  if (challenge.status === 'expired') {
    return NextResponse.json({ error: 'Challenge has expired' }, { status: 410 });
  }

  const service = createServiceClient();
  const { data: questions, error: qError } = await service
    .from('challenge_questions')
    .select('questions_public')
    .eq('challenge_id', challenge.id)
    .single();

  if (qError || !questions) {
    return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
  }

  return NextResponse.json({ questions: questions.questions_public });
}
