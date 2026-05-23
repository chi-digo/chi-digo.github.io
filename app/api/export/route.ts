import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profileRes, favouritesRes, roundsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('favourites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('quiz_rounds').select('*').eq('user_id', user.id).order('played_at', { ascending: false }),
  ]);

  const roundIds = (roundsRes.data || []).map((r: { id: string }) => r.id);
  let answers: Record<string, unknown>[] = [];
  if (roundIds.length > 0) {
    const { data } = await supabase
      .from('quiz_answers')
      .select('*')
      .in('round_id', roundIds)
      .order('question_index', { ascending: true });
    answers = data || [];
  }

  const roundsWithAnswers = (roundsRes.data || []).map((round: { id: string }) => ({
    ...round,
    answers: answers.filter((a: Record<string, unknown>) => a.round_id === round.id),
  }));

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileRes.data,
    favourites: favouritesRes.data || [],
    quiz_rounds: roundsWithAnswers,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="chidigo-data-export.json"',
    },
  });
}
