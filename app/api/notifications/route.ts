import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCaller, badRequest, canReview, serverError } from '@/lib/contributions/server';
import type { Scope } from '@/lib/contributions/schemas';
import { payloadSummary } from '@/lib/contributions/display';

/**
 * The caller's latest notifications (spec 34 technical §9), each with a short summary of the
 * suggestion it is about. Reviewer identities are never included.
 */
export async function GET() {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  const { data, error } = await caller.db
    .from('notifications')
    .select('id, kind, contribution_id, read_at, created_at')
    .eq('user_id', caller.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return serverError(error, 'notifications');

  const ids = [...new Set((data ?? []).map((n) => n.contribution_id).filter(Boolean))] as string[];
  const { data: rows } = ids.length
    ? await caller.db
        .from('contributions')
        .select('id, type, scope, target_type, target_id, target_label, payload, final_payload, status, live_status, outcome, review_note')
        .in('id', ids)
    : { data: [] };
  const byId = new Map((rows ?? []).map((r) => [r.id, r]));
  const out = (data ?? []).map((n) => {
    let c = n.contribution_id ? byId.get(n.contribution_id) : null;
    const forReviewers = n.kind === 'second_review' || n.kind === 'report_hidden';
    // Reviewer notices show the item only while the reader can still review it.
    if (c && forReviewers && !(n.kind === 'report_hidden' ? caller.role === 'admin' && !caller.blocked : canReview(caller, c.scope as Scope))) c = null;
    return {
      ...n,
      contribution: c
        ? {
            type: c.type,
            target_type: c.target_type,
            target_id: c.target_id,
            target_label: c.target_label,
            // Contributors see what they wrote; a reviewer's edit isn't theirs to read before it's live.
            summary: payloadSummary(forReviewers ? (c.final_payload ?? c.payload) : c.payload).slice(0, 120),
            status: c.status,
            live_status: c.live_status,
            outcome: c.outcome,
            review_note: n.kind === 'needs_info' || n.kind === 'declined' ? c.review_note : null,
          }
        : null,
    };
  });
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}

const markSchema = z.union([z.object({ ids: z.array(z.number().int()).min(1).max(100) }), z.object({ all: z.literal(true) })]);

/** Mark notifications as read. */
export async function POST(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  const body = markSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest('invalid', body.error.issues);
  let q = caller.db.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', caller.id).is('read_at', null);
  if ('ids' in body.data) q = q.in('id', body.data.ids);
  const { error } = await q;
  if (error) return serverError(error, 'notifications_mark');
  return NextResponse.json({ ok: true });
}
