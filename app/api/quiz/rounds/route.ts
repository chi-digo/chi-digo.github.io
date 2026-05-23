import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('quiz_rounds')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { score, total, time_taken_ms, difficulty_distribution, category_breakdown, answers } = body;

  if (typeof score !== 'number' || typeof total !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: round, error: roundError } = await supabase
    .from('quiz_rounds')
    .insert({
      user_id: user.id,
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
      user_id: user.id,
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

    const { error: answersError } = await supabase
      .from('quiz_answers')
      .insert(answerRows);

    if (answersError) {
      return NextResponse.json({ error: answersError.message }, { status: 500 });
    }
  }

  return NextResponse.json(round, { status: 201 });
}
