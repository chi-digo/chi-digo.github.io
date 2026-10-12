import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCaller, badRequest, serverError } from '@/lib/contributions/server';

/** The caller's latest notifications (decisions on their suggestions, admin alerts). */
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
  return NextResponse.json(data ?? [], { headers: { 'Cache-Control': 'no-store' } });
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
