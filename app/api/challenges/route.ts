import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateShortCode } from '@/lib/challenge/shortcode';
import { getQuizBankMap } from '@/lib/challenge/quiz-bank';
import { rateLimit } from '@/lib/challenge/rate-limit';
import { headers } from 'next/headers';
import type { ChallengeQuestionPublic, ChallengeQuestionAnswers } from '@/lib/challenge/types';

export async function POST(request: Request) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? 'unknown';

  if (!rateLimit(ip, 5)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

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
    .select('question_id, question_index, category, difficulty, correct_option_id')
    .eq('round_id', roundId)
    .eq('user_id', user.id)
    .order('question_index', { ascending: true });

  if (answersError || !answers || answers.length === 0) {
    return NextResponse.json({ error: 'No answers found for round' }, { status: 404 });
  }

  const quizBank = await getQuizBankMap();

  const questionsPublic: ChallengeQuestionPublic[] = [];
  const questionsAnswers: ChallengeQuestionAnswers = {};

  for (const a of answers) {
    const bankQ = quizBank.get(a.question_id);
    if (!bankQ) {
      return NextResponse.json({ error: `Question ${a.question_id} not found in quiz bank` }, { status: 500 });
    }

    questionsPublic.push({
      source_question_id: bankQ.id,
      question_index: a.question_index,
      category: bankQ.cat,
      difficulty: bankQ.dif,
      question_text: bankQ.q,
      options: bankQ.opts,
    });

    questionsAnswers[bankQ.id] = {
      correct_answer_index: bankQ.ans,
      explanation: bankQ.exp,
    };
  }

  const service = createServiceClient();

  for (let attempt = 0; attempt < 3; attempt++) {
    const shortCode = generateShortCode();
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
      if (insertError.code === '23505' && attempt < 2) continue;
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }

    const { error: questionsError } = await service
      .from('challenge_questions')
      .insert({
        challenge_id: challenge.id,
        questions_public: questionsPublic,
        questions_answers: questionsAnswers,
      });

    if (questionsError) {
      await service.from('challenges').delete().eq('id', challenge.id);
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chidigo.org';
    return NextResponse.json({
      id: challenge.id,
      short_code: shortCode,
      url: `${baseUrl}/challenge/${shortCode}`,
      score: round.score,
      total: round.total,
      created_at: challenge.created_at,
    }, { status: 201 });
  }

  return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
}
