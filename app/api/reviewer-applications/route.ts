import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LIMITS, SCOPES } from '@/lib/contributions/schemas';
import { optSafeText } from '@/lib/contributions/text';
import { getCaller, badRequest, forbidden, logEvent, serverError } from '@/lib/contributions/server';

const schema = z.object({ scopes: z.array(z.enum(SCOPES)).min(1), message: optSafeText(2000) });

/** Apply to review a scope, after 5 accepted suggestions in that scope (spec §3.1). */
export async function POST(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.role !== 'member' || caller.blocked) return forbidden();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('invalid', parsed.error.issues);

  const { db } = caller;
  try {
    const [{ data: mine }, { count: open }] = await Promise.all([
      db.from('contributions').select('scope').eq('user_id', caller.id).eq('status', 'accepted'),
      db.from('reviewer_applications').select('id', { count: 'exact', head: true }).eq('user_id', caller.id).eq('status', 'pending'),
    ]);
    const short = parsed.data.scopes.filter((s) => (mine ?? []).filter((c) => c.scope === s).length < LIMITS.acceptedToApply);
    if (short.length) return NextResponse.json({ error: 'not_enough_accepted', scopes: short }, { status: 403 });
    if ((open ?? 0) > 0) return NextResponse.json({ error: 'already_applied' }, { status: 409 });

    const { data, error } = await db.from('reviewer_applications')
      .insert({ user_id: caller.id, scopes: parsed.data.scopes, message: parsed.data.message ?? null })
      .select('id, status, scopes, created_at').single();
    if (error) return serverError(error, 'apply');
    await logEvent(caller, { action: 'apply', subject_user_id: caller.id, details: { scopes: parsed.data.scopes } });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return serverError(err, 'apply');
  }
}
