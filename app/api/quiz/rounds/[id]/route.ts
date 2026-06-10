import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: round, error: roundError } = await supabase
    .from('quiz_rounds')
    .select('*, challenges(short_code)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: answers, error: answersError } = await supabase
    .from('quiz_answers')
    .select('*')
    .eq('round_id', id)
    .eq('user_id', user.id)
    .order('question_index', { ascending: true });

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 });
  }

  const challenge = (round as Record<string, unknown>).challenges as
    | { short_code: string }[]
    | null;
  const challengeCode = challenge?.[0]?.short_code ?? null;
  const { challenges: _, ...roundData } = round as Record<string, unknown>;

  return NextResponse.json({ ...roundData, answers, challenge_code: challengeCode });
}
