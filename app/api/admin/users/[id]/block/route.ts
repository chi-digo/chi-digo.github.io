import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCaller, badRequest, forbidden, logEvent, serverError, refreshCredits } from '@/lib/contributions/server';

const schema = z.object({ blocked: z.boolean() });

/**
 * Block a user: their open suggestions are declined and they can't contribute, agree or review.
 * Their role is kept, so unblocking restores it (spec §3).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return badRequest('invalid id');
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.role !== 'admin' || caller.blocked) return forbidden();
  if (id === caller.id) return forbidden('self');
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('invalid', parsed.error.issues);

  const { db } = caller;
  try {
    const { data: target } = await db.from('profiles').select('role').eq('id', id).single();
    if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (target.role === 'admin') return forbidden('is_admin');

    const { error } = await db.from('profiles').update({ blocked_at: parsed.data.blocked ? new Date().toISOString() : null }).eq('id', id);
    if (error) return serverError(error, 'block');
    let declined = 0;
    if (parsed.data.blocked) {
      const { data } = await db.from('contributions')
        .update({ status: 'declined', review_note: 'Account blocked', reviewer_id: caller.id, reviewed_at: new Date().toISOString() })
        .eq('user_id', id).in('status', ['pending', 'needs_info']).select('id');
      declined = data?.length ?? 0;
    }
    refreshCredits();
    await logEvent(caller, { action: parsed.data.blocked ? 'block' : 'unblock', subject_user_id: id, details: { declined } });
    return NextResponse.json({ blocked: parsed.data.blocked, declined });
  } catch (err) {
    return serverError(err, 'block');
  }
}
