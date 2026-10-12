import { NextResponse } from 'next/server';
import { z } from 'zod';
import { REGIONS, CONFIDENCE } from '@/lib/contributions/schemas';
import { getCaller, badRequest, forbidden, rpc, rpcError, serverError } from '@/lib/contributions/server';

const bodySchema = z.object({ region: z.enum(REGIONS).optional(), confidence: z.enum(CONFIDENCE).optional() });

/** Agree with a public suggestion instead of submitting a duplicate (spec §6). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return badRequest('invalid id');
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.blocked) return forbidden('blocked');
  const body = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return badRequest('invalid', body.error.issues);

  try {
    const r = await rpc<{ agree_count?: number; error?: string }>(caller.db, 'agree_contribution', {
      p_uid: caller.id, p_cid: id, p_region: body.data.region ?? null, p_confidence: body.data.confidence ?? null,
    });
    if (r.error) return rpcError(r.error);
    return NextResponse.json({ agreed: true, agree_count: r.agree_count });
  } catch (err) {
    return serverError(err, 'agree');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return badRequest('invalid id');
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  try {
    const r = await rpc<{ agree_count: number }>(caller.db, 'unagree_contribution', { p_uid: caller.id, p_cid: id });
    return NextResponse.json({ agreed: false, agree_count: r.agree_count });
  } catch (err) {
    return serverError(err, 'unagree');
  }
}
