import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PAYLOADS, type ContributionType } from '@/lib/contributions/schemas';
import { optSafeText } from '@/lib/contributions/text';
import { getCaller, badRequest, forbidden, serverError, overlayArea } from '@/lib/contributions/server';
import { translationTextProblem } from '@/lib/contributions/review';
import { resolveTarget } from '@/lib/contributions/targets';
import { getAreaOverlay } from '@/lib/contributions/overlay';

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('withdraw') }),
  z.object({ action: z.literal('reply'), reply: optSafeText(1000) }),
  z.object({ action: z.literal('resubmit'), payload: z.record(z.string(), z.unknown()), note: optSafeText(2000) }),
]);

/** Withdraw an open suggestion, or answer a reviewer's question (reply or edited resubmission). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return badRequest('invalid id');
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('invalid', parsed.error.issues);
  const body = parsed.data;
  const { db } = caller;

  try {
    const { data: row } = await db.from('contributions').select('type, status, is_test, target_type, target_id').eq('id', id).eq('user_id', caller.id).single();
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    let update: Record<string, unknown>;
    let from: string[];
    if (body.action === 'withdraw') {
      update = { status: 'withdrawn', claimed_by: null, claimed_until: null };
      from = ['pending', 'needs_info'];
    } else {
      if (caller.blocked) return forbidden('blocked');
      from = ['needs_info'];
      if (body.action === 'reply') {
        if (!body.reply) return badRequest('reply is empty');
        update = { status: 'pending', reply: body.reply };
      } else {
        const payload = PAYLOADS[row.type as ContributionType].safeParse(body.payload);
        if (!payload.success) return badRequest('invalid', payload.error.issues);
        // The edit may point at another section or language, so the base is taken again.
        const target = resolveTarget(row.type, row.target_type ?? undefined, row.target_id ?? undefined, payload.data, {
          isTest: row.is_test,
          liveChanges: overlayArea(row.target_type) ? await getAreaOverlay(overlayArea(row.target_type)!) : [],
        });
        if (!target) return NextResponse.json({ error: 'target_not_found' }, { status: 404 });
        if (row.type === 'translation_fix') {
          const problem = translationTextProblem(target.base?.value, (payload.data as { proposed?: string }).proposed);
          if (problem) return badRequest(problem);
        }
        update = {
          status: 'pending', payload: payload.data, base: target.base ?? null, target_path: target.path, target_label: target.label,
          ...(body.note !== undefined && { note: body.note ?? null }),
        };
      }
    }

    // One conditional update: a reviewer deciding at the same moment wins or loses cleanly.
    const { data: done, error } = await db
      .from('contributions')
      .update(update)
      .eq('id', id)
      .eq('user_id', caller.id)
      .in('status', from)
      .select('id, status')
      .maybeSingle();
    if (error) return serverError(error, 'patch');
    if (!done) return NextResponse.json({ error: 'conflict' }, { status: 409 });

    await db.from('contribution_events').insert({ actor_id: caller.id, action: body.action, contribution_id: id, is_test: row.is_test });
    return NextResponse.json({ status: done.status });
  } catch (err) {
    return serverError(err, 'patch');
  }
}
