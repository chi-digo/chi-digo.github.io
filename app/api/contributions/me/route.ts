import { NextResponse } from 'next/server';
import { LIMITS, SCOPES } from '@/lib/contributions/schemas';
import { getCaller, serverError } from '@/lib/contributions/server';

/** The caller's role, scopes and standing: for menus, the review badge and "Apply to review". */
export async function GET() {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  const { db } = caller;
  try {
    const [{ data: mine }, { data: application }, { count: unread }] = await Promise.all([
      db.from('contributions').select('scope, status').eq('user_id', caller.id),
      db.from('reviewer_applications').select('id, status, scopes, created_at, decision_note')
        .eq('user_id', caller.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', caller.id).is('read_at', null),
    ]);
    const acceptedByScope = Object.fromEntries(
      SCOPES.map((s) => [s, (mine ?? []).filter((c) => c.scope === s && c.status === 'accepted').length]),
    );
    const pendingApplication = application?.status === 'pending';
    return NextResponse.json(
      {
        role: caller.role,
        scopes: caller.scopes,
        blocked: caller.blocked,
        accepted: (mine ?? []).filter((c) => c.status === 'accepted').length,
        accepted_by_scope: acceptedByScope,
        can_apply_for: caller.role === 'member' && !caller.blocked && !pendingApplication
          ? SCOPES.filter((s) => acceptedByScope[s] >= LIMITS.acceptedToApply)
          : [],
        application: application ?? null,
        unread: unread ?? 0,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return serverError(err, 'me');
  }
}
