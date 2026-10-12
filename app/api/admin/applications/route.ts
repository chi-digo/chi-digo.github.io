import { NextResponse } from 'next/server';
import { z } from 'zod';
import { REVIEW_SCOPES } from '@/lib/contributions/schemas';
import { getCaller, badRequest, forbidden, logEvent, serverError } from '@/lib/contributions/server';
import { loadUsers } from '@/lib/contributions/admin';

/** Open reviewer applications with each applicant's track record. */
export async function GET() {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.role !== 'admin' || caller.blocked) return forbidden();
  try {
    const { data: apps } = await caller.db.from('reviewer_applications')
      .select('id, user_id, scopes, message, status, created_at').eq('status', 'pending').order('created_at');
    const users = await loadUsers(caller.db, (apps ?? []).map((a) => a.user_id));
    const byId = new Map(users.map((u) => [u.id, u]));
    return NextResponse.json((apps ?? []).map((a) => ({ ...a, user: byId.get(a.user_id) ?? null })), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return serverError(err, 'applications_get');
  }
}

const schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['approve', 'decline']),
  scopes: z.array(z.enum(REVIEW_SCOPES)).optional(),
  note: z.string().trim().max(2000).optional(),
});

/** Approve (granting the chosen scopes) or decline an application. */
export async function POST(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.role !== 'admin' || caller.blocked) return forbidden();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('invalid', parsed.error.issues);
  const { id, decision, note } = parsed.data;
  const { db } = caller;

  try {
    // Claim the application atomically so two admins can't both decide it.
    const { data: app } = await db.from('reviewer_applications')
      .update({ status: decision === 'approve' ? 'approved' : 'declined', decided_by: caller.id, decided_at: new Date().toISOString(), decision_note: note || null })
      .eq('id', id).eq('status', 'pending').select('user_id, scopes').maybeSingle();
    if (!app) return NextResponse.json({ error: 'conflict' }, { status: 409 });

    if (decision === 'approve') {
      const chosen = parsed.data.scopes?.length ? parsed.data.scopes : (app.scopes as string[]);
      const scopes = chosen.includes('all') ? ['all'] : chosen;
      const { data: target } = await db.from('profiles').select('role, blocked_at').eq('id', app.user_id).single();
      if (target?.role === 'member' && !target.blocked_at) {
        await db.from('profile_review_scopes').delete().eq('user_id', app.user_id);
        await db.from('profile_review_scopes').insert(scopes.map((scope) => ({ user_id: app.user_id, scope, granted_by: caller.id })));
        await db.from('profiles').update({ role: 'reviewer' }).eq('id', app.user_id);
      }
      await logEvent(caller, { action: 'grant_reviewer', subject_user_id: app.user_id, details: { scopes, application_id: id } });
    } else {
      await logEvent(caller, { action: 'decline_application', subject_user_id: app.user_id, details: { application_id: id } });
    }
    return NextResponse.json({ status: decision === 'approve' ? 'approved' : 'declined' });
  } catch (err) {
    return serverError(err, 'applications_post');
  }
}
