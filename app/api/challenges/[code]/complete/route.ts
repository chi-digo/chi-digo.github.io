import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { rateLimit } from '@/lib/challenge/rate-limit';
import { headers } from 'next/headers';
import { resolveChallengerIdentity } from '@/lib/challenge/resolve-identity';
import type { CompletionAnswer, ChallengeQuestionAnswers, ChallengeQuestionPublic } from '@/lib/challenge/types';

function validateAnswers(
  answers: unknown,
  validQuestionIds: Set<string>,
): CompletionAnswer[] | null {
  if (!Array.isArray(answers) || answers.length !== 10) return null;

  const validated: CompletionAnswer[] = [];
  for (const a of answers) {
    if (typeof a !== 'object' || a === null) return null;
    const { source_question_id, selected_answer_index, time_to_answer_ms } = a as Record<string, unknown>;

    if (typeof source_question_id !== 'string' || source_question_id.length === 0 || source_question_id.length > 100) return null;
    if (!validQuestionIds.has(source_question_id)) return null;
    if (typeof selected_answer_index !== 'number' || !Number.isInteger(selected_answer_index) || selected_answer_index < 0 || selected_answer_index > 3) return null;

    const entry: CompletionAnswer = { source_question_id, selected_answer_index };
    if (time_to_answer_ms !== undefined) {
      if (typeof time_to_answer_ms !== 'number' || !Number.isInteger(time_to_answer_ms) || time_to_answer_ms <= 0 || time_to_answer_ms > 3_600_000) return null;
      entry.time_to_answer_ms = time_to_answer_ms;
    }
    validated.push(entry);
  }
  return validated;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? 'unknown';

  if (!rateLimit(ip, 10)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !rateLimit(`anon:${ip}`, 3)) {
    return NextResponse.json({ error: 'Too many anonymous submissions' }, { status: 429 });
  }

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('id, challenger_id, score, total, status, round_id, time_taken_ms')
    .eq('short_code', code)
    .single();

  if (challengeError || !challenge) {
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
    return NextResponse.json({ error: 'Questions not found' }, { status: 500 });
  }

  const questionsPublic = questionsRow.questions_public as ChallengeQuestionPublic[];
  const questionsAnswers = questionsRow.questions_answers as ChallengeQuestionAnswers;
  const validQuestionIds = new Set(questionsPublic.map((q) => q.source_question_id));

  const body = await request.json();
  const validated = validateAnswers(body.answers, validQuestionIds);
  if (!validated) {
    return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
  }

  const timeTakenMs = typeof body.time_taken_ms === 'number' && Number.isInteger(body.time_taken_ms) && body.time_taken_ms > 0 && body.time_taken_ms <= 3_600_000
    ? body.time_taken_ms : null;

  const anonymousId = !user && typeof body.anonymous_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.anonymous_id)
    ? body.anonymous_id : (!user ? null : undefined);

  if (!user && !anonymousId) {
    return NextResponse.json({ error: 'anonymous_id is required for unauthenticated users' }, { status: 400 });
  }

  let score = 0;
  for (const a of validated) {
    const answer = questionsAnswers[a.source_question_id];
    if (answer && a.selected_answer_index === answer.correct_answer_index) {
      score++;
    }
  }

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    displayName = profile?.display_name ?? null;
  }

  const completionData = {
    challenge_id: challenge.id,
    challenger_id: challenge.challenger_id,
    ...(user ? { user_id: user.id } : {}),
    ...(anonymousId ? { anonymous_id: anonymousId } : {}),
    display_name: displayName ?? 'Mtu wa Chidigo',
    score,
    total: challenge.total,
    time_taken_ms: timeTakenMs,
    answers: validated,
  };

  const { data: completion, error: insertError } = await service
    .from('challenge_completions')
    .upsert(completionData, {
      onConflict: user ? 'challenge_id,user_id' : 'challenge_id,anonymous_id',
    })
    .select('id, score, total, time_taken_ms, completed_at')
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to save completion' }, { status: 500 });
  }

  if (user && typeof body.anonymous_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.anonymous_id)) {
    await service
      .from('challenge_completions')
      .delete()
      .eq('challenge_id', challenge.id)
      .eq('anonymous_id', body.anonymous_id)
      .is('user_id', null);
  }

  // Build comparison: get challenger's answers from quiz_answers
  let challengerAnswers: { source_question_id: string; selected_answer_index: number; is_correct: boolean }[] = [];
  if (challenge.challenger_id) {
    const { data: cAnswers } = await service
      .from('quiz_answers')
      .select('question_id, selected_option_id')
      .eq('round_id', challenge.round_id)
      .order('question_index', { ascending: true });

    if (cAnswers) {
      challengerAnswers = cAnswers.map((a) => {
        const idx = Number(a.selected_option_id);
        const safeIdx = Number.isFinite(idx) ? idx : 0;
        const answer = questionsAnswers[a.question_id];
        return {
          source_question_id: a.question_id,
          selected_answer_index: safeIdx,
          is_correct: answer ? safeIdx === answer.correct_answer_index : false,
        };
      });
    }
  }

  const questionsWithAnswers = questionsPublic.map((q) => ({
    ...q,
    correct_answer_index: questionsAnswers[q.source_question_id]?.correct_answer_index,
    explanation: questionsAnswers[q.source_question_id]?.explanation,
  }));

  const { count } = await supabase
    .from('challenge_completions')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challenge.id);

  let challengerIdentity = { display_name: null as string | null, avatar_url: null as string | null };
  if (challenge.challenger_id) {
    challengerIdentity = await resolveChallengerIdentity(service, challenge.challenger_id);
  }

  return NextResponse.json({
    completion_id: completion.id,
    score,
    total: challenge.total,
    time_taken_ms: timeTakenMs,
    challenger: {
      display_name: challengerIdentity.display_name,
      avatar_url: challengerIdentity.avatar_url,
      score: challenge.score,
      time_taken_ms: challenge.time_taken_ms,
      answers: challengerAnswers,
    },
    questions: questionsWithAnswers,
    completions_count: count ?? 0,
  }, { status: 201 });
}
