import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateShortCode } from '@/lib/challenge/shortcode';
import type { ChallengeQuestionPublic, ChallengeQuestionAnswers } from '@/lib/challenge/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const roundId = typeof body.round_id === 'string' ? body.round_id : null;
  if (!roundId) {
    return NextResponse.json({ error: 'round_id is required' }, { status: 400 });
  }

  const { data: round, error: roundError } = await supabase
    .from('quiz_rounds')
    .select('*')
    .eq('id', roundId)
    .eq('user_id', user.id)
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  const { data: answers, error: answersError } = await supabase
    .from('quiz_answers')
    .select('*')
    .eq('round_id', roundId)
    .eq('user_id', user.id)
    .order('question_index', { ascending: true });

  if (answersError || !answers || answers.length === 0) {
    return NextResponse.json({ error: 'No answers found for round' }, { status: 404 });
  }

  const questionsPublic: ChallengeQuestionPublic[] = answers.map((a) => ({
    source_question_id: a.question_id,
    question_index: a.question_index,
    category: a.category as ChallengeQuestionPublic['category'],
    difficulty: a.difficulty as ChallengeQuestionPublic['difficulty'],
    question_text: typeof a.question_text === 'string'
      ? { e: a.question_text, s: a.question_text, d: a.question_text }
      : a.question_text,
    options: a.options,
  }));

  const questionsAnswers: ChallengeQuestionAnswers = {};
  for (const a of answers) {
    questionsAnswers[a.question_id] = {
      correct_answer_index: Number(a.correct_option_id),
      explanation: typeof a.explanation === 'string'
        ? { e: a.explanation, s: a.explanation, d: a.explanation }
        : a.explanation ?? undefined,
    };
  }

  const service = createServiceClient();
  let shortCode = '';
  let challengeId = '';

  for (let attempt = 0; attempt < 3; attempt++) {
    shortCode = generateShortCode();
    const { data: challenge, error: insertError } = await service
      .from('challenges')
      .insert({
        short_code: shortCode,
        challenger_id: user.id,
        round_id: roundId,
        score: round.score,
        total: round.total,
        category_breakdown: round.category_breakdown,
        difficulty_distribution: round.difficulty_distribution,
        time_taken_ms: round.time_taken_ms,
      })
      .select('id, short_code, score, total, created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505' && attempt < 2) continue; // unique violation, retry
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }

    challengeId = challenge.id;

    const { error: questionsError } = await service
      .from('challenge_questions')
      .insert({
        challenge_id: challengeId,
        questions_public: questionsPublic,
        questions_answers: questionsAnswers,
      });

    if (questionsError) {
      await service.from('challenges').delete().eq('id', challengeId);
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chidigo.org';
    return NextResponse.json({
      id: challengeId,
      short_code: shortCode,
      url: `${baseUrl}/challenge/${shortCode}`,
      score: round.score,
      total: round.total,
      created_at: challenge.created_at,
    }, { status: 201 });
  }

  return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
}
