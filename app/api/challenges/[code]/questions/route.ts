import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit } from '@/lib/challenge/rate-limit';
import { headers } from 'next/headers';
import type { ChallengeQuestionPublic, ChallengeQuestionAnswers } from '@/lib/challenge/types';

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
  const { data: questionsRow, error: qError } = await service
    .from('challenge_questions')
    .select('questions_public, questions_answers')
    .eq('challenge_id', challenge.id)
    .single();

  if (qError || !questionsRow) {
    return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
  }

  const questionsPublic = questionsRow.questions_public as ChallengeQuestionPublic[];
  const questionsAnswers = questionsRow.questions_answers as ChallengeQuestionAnswers;

  const questions = questionsPublic.map((q) => ({
    ...q,
    correct_answer_index: questionsAnswers[q.source_question_id]?.correct_answer_index,
    explanation: questionsAnswers[q.source_question_id]?.explanation,
  }));

  return NextResponse.json({ questions });
}
