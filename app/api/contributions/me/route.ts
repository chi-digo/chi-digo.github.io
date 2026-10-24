import { NextResponse } from 'next/server';
import { LIMITS, SCOPES } from '@/lib/contributions/schemas';
import { getCaller, isReviewer, serverError } from '@/lib/contributions/server';

/** The caller's role, scopes and standing: for menus, the review badge and "Apply to review". */
export async function GET() {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  const { db } = caller;
  try {
    // Admins hear about translation fixes nobody has picked up in 7 days (spec 34 §17, decision 5).
    if (caller.role === 'admin' && !caller.blocked) {
      const { error } = await db.rpc('notify_overdue_translations');
      if (error) console.error('notify_overdue_translations', error.message);
    }
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

    // For the Review link: items waiting in the caller's scopes, not their own.
    let reviewPending = 0;
    if (isReviewer(caller)) {
      const scopes = caller.role === 'admin' || caller.scopes.includes('all') ? [...SCOPES] : SCOPES.filter((s) => caller.scopes.includes(s));
      if (scopes.length) {
        const { count } = await db.from('contributions').select('id', { count: 'exact', head: true })
          .in('scope', scopes).in('status', ['pending', 'needs_info']).eq('is_test', caller.isTest).or(`user_id.is.null,user_id.neq.${caller.id}`);
        // Plus accepted items waiting for a second reviewer, which the caller didn't accept.
        const { count: seconds } = await db.from('contributions').select('id', { count: 'exact', head: true })
          .in('scope', scopes).eq('live_status', 'awaiting_second').eq('is_test', caller.isTest).neq('reviewer_id', caller.id);
        reviewPending = (count ?? 0) + (seconds ?? 0);
      }
    }
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
        review_pending: reviewPending,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return serverError(err, 'me');
  }
}
