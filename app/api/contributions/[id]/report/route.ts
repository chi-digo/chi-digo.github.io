import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCaller, badRequest, forbidden, rpc, rpcError, serverError } from '@/lib/contributions/server';

const bodySchema = z.object({ reason: z.enum(['offensive', 'spam', 'personal_info', 'other']) });

/** Report a public suggestion. Three reports hide it until an admin looks (spec §6). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return badRequest('invalid id');
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.blocked) return forbidden('blocked');
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest('invalid', body.error.issues);

  try {
    const r = await rpc<{ reported?: boolean; hidden?: boolean; error?: string }>(caller.db, 'report_contribution', {
      p_uid: caller.id, p_cid: id, p_reason: body.data.reason,
    });
    if (r.error) return rpcError(r.error);
    return NextResponse.json({ reported: true });
  } catch (err) {
    return serverError(err, 'report');
  }
}
