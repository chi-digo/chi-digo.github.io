import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profileRes, favouritesRes, roundsRes, contributionsRes, agreementsRes, reportsRes, notificationsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('favourites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('quiz_rounds').select('*').eq('user_id', user.id).order('played_at', { ascending: false }),
    supabase.from('my_contributions').select('*').order('created_at', { ascending: false }),
    supabase.from('contribution_agreements').select('contribution_id, region, confidence, created_at').eq('user_id', user.id),
    supabase.from('contribution_reports').select('contribution_id, reason, created_at').eq('user_id', user.id),
    supabase.from('notifications').select('kind, contribution_id, read_at, created_at').eq('user_id', user.id),
  ]);

  // Applications and the user's own log entries are read with the service role (clients can't read
  // the log); reviewer and actor identities are left out.
  const service = createServiceClient();
  const [applicationsRes, eventsRes] = await Promise.all([
    service.from('reviewer_applications').select('scopes, message, status, decision_note, created_at, decided_at').eq('user_id', user.id),
    service.from('contribution_events').select('action, contribution_id, created_at').eq('actor_id', user.id).order('created_at'),
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
    contributions: contributionsRes.data || [],
    contribution_agreements: agreementsRes.data || [],
    contribution_reports: reportsRes.data || [],
    reviewer_applications: applicationsRes.data || [],
    notifications: notificationsRes.data || [],
    contribution_activity: eventsRes.data || [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="chidigo-data-export.json"',
    },
  });
}
