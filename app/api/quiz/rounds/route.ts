import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

const ANON_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [roundsResult, completionsResult] = await Promise.all([
    supabase
      .from('quiz_rounds')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(50),
    supabase
      .from('challenge_completions')
      .select('id, challenge_id, score, total, time_taken_ms, completed_at, challenges(short_code)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(50),
  ]);

  if (roundsResult.error) {
    return NextResponse.json({ error: roundsResult.error.message }, { status: 500 });
  }

  const rounds = (roundsResult.data ?? []).map((r) => ({
    ...r,
    played_at: r.played_at as string,
    type: 'quiz' as const,
  }));
  const completions = (completionsResult.data ?? []).map((c) => {
    const joined = c.challenges as unknown as { short_code: string } | null;
    return {
      id: c.id,
      challenge_id: c.challenge_id,
      short_code: joined?.short_code ?? null,
      score: c.score,
      total: c.total,
      time_taken_ms: c.time_taken_ms,
      played_at: c.completed_at,
      type: 'challenge' as const,
    };
  });

  const merged = [...rounds, ...completions].sort(
    (a, b) => new Date(String(b.played_at)).getTime() - new Date(String(a.played_at)).getTime(),
  ).slice(0, 50);

  return NextResponse.json(merged);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const { score, total, time_taken_ms, difficulty_distribution, category_breakdown, answers, anonymous_id } = body;

  if (typeof score !== 'number' || typeof total !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const anonymousId = !user && typeof anonymous_id === 'string' && ANON_ID_RE.test(anonymous_id)
    ? anonymous_id : null;

  if (!user && !anonymousId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = user ? supabase : createServiceClient();

  const { data: round, error: roundError } = await db
    .from('quiz_rounds')
    .insert({
      ...(user ? { user_id: user.id } : {}),
      ...(anonymousId ? { anonymous_id: anonymousId } : {}),
      score,
      total,
      time_taken_ms: time_taken_ms || null,
      difficulty_distribution: difficulty_distribution || null,
      category_breakdown: category_breakdown || null,
    })
    .select()
    .single();

  if (roundError) {
    return NextResponse.json({ error: roundError.message }, { status: 500 });
  }

  if (answers && Array.isArray(answers) && answers.length > 0) {
    const answerRows = answers.map((a: Record<string, unknown>) => ({
      round_id: round.id,
      ...(user ? { user_id: user.id } : {}),
      question_index: a.question_index,
      question_id: a.question_id,
      category: a.category,
      difficulty: a.difficulty,
      question_text: a.question_text,
      options: a.options,
      selected_option_id: a.selected_option_id,
      correct_option_id: a.correct_option_id,
      is_correct: a.is_correct,
      time_to_answer_ms: a.time_to_answer_ms || null,
      explanation: a.explanation || null,
    }));

    const { error: answersError } = await db
      .from('quiz_answers')
      .insert(answerRows);

    if (answersError) {
      return NextResponse.json({ error: answersError.message }, { status: 500 });
    }
  }

  return NextResponse.json(round, { status: 201 });
}
