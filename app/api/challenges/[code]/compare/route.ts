import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit } from '@/lib/challenge/rate-limit';
import { headers } from 'next/headers';
import type { ChallengeQuestionPublic, ChallengeQuestionAnswers, CompletionAnswer } from '@/lib/challenge/types';

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

  const url = new URL(request.url);
  const completionId = url.searchParams.get('with');
  if (!completionId) {
    return NextResponse.json({ error: 'with parameter is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('id, challenger_id, score, round_id')
    .eq('short_code', code)
    .single();

  if (error || !challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  const service = createServiceClient();

  const { data: completion } = await service
    .from('challenge_completions')
    .select('id, display_name, score, time_taken_ms, answers')
    .eq('id', completionId)
    .eq('challenge_id', challenge.id)
    .single();

  if (!completion) {
    return NextResponse.json({ error: 'Completion not found' }, { status: 404 });
  }

  const { data: questionsRow } = await service
    .from('challenge_questions')
    .select('questions_public, questions_answers')
    .eq('challenge_id', challenge.id)
    .single();

  if (!questionsRow) {
    return NextResponse.json({ error: 'Questions not found' }, { status: 500 });
  }

  const questionsPublic = questionsRow.questions_public as ChallengeQuestionPublic[];
  const questionsAnswers = questionsRow.questions_answers as ChallengeQuestionAnswers;

  const questionsWithAnswers = questionsPublic.map((q) => ({
    ...q,
    correct_answer_index: questionsAnswers[q.source_question_id]?.correct_answer_index,
    explanation: questionsAnswers[q.source_question_id]?.explanation,
  }));

  const { data: challengerAnswersRaw } = await service
    .from('quiz_answers')
    .select('question_id, selected_option_id')
    .eq('round_id', challenge.round_id)
    .order('question_index', { ascending: true });

  let challengerName: string | null = null;
  if (challenge.challenger_id) {
    const { data: profile } = await service
      .from('profiles')
      .select('display_name')
      .eq('id', challenge.challenger_id)
      .single();
    challengerName = profile?.display_name ?? null;
  }

  return NextResponse.json({
    questions: questionsWithAnswers,
    player_a: {
      display_name: challengerName,
      answers: (challengerAnswersRaw ?? []).map((a) => {
        const idx = Number(a.selected_option_id);
        const answer = questionsAnswers[a.question_id];
        return {
          source_question_id: a.question_id,
          selected_answer_index: Number.isFinite(idx) ? idx : 0,
          is_correct: answer ? idx === answer.correct_answer_index : false,
        };
      }),
      score: challenge.score,
      time_taken_ms: null,
    },
    player_b: {
      display_name: completion.display_name,
      answers: (completion.answers as CompletionAnswer[]).map((a) => ({
        ...a,
        is_correct: questionsAnswers[a.source_question_id]
          ? a.selected_answer_index === questionsAnswers[a.source_question_id].correct_answer_index
          : false,
      })),
      score: completion.score,
      time_taken_ms: completion.time_taken_ms,
    },
  });
}
