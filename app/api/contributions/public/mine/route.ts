import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCaller, badRequest, serverError } from '@/lib/contributions/server';

const ids = z.array(z.string().uuid()).max(50);

/** Which of the given public suggestions the caller has agreed with or reported. Never cached. */
export async function GET(request: Request) {
  const raw = (new URL(request.url).searchParams.get('ids') ?? '').split(',').filter(Boolean);
  const parsed = ids.safeParse(raw);
  if (!parsed.success) return badRequest('invalid ids');
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (!parsed.data.length) return NextResponse.json({ agreed: [], reported: [] }, { headers: { 'Cache-Control': 'no-store' } });

  try {
    const [agreed, reported] = await Promise.all([
      caller.db.from('contribution_agreements').select('contribution_id').eq('user_id', caller.id).in('contribution_id', parsed.data),
      caller.db.from('contribution_reports').select('contribution_id').eq('user_id', caller.id).in('contribution_id', parsed.data),
    ]);
    return NextResponse.json(
      {
        agreed: (agreed.data ?? []).map((r) => r.contribution_id),
        reported: (reported.data ?? []).map((r) => r.contribution_id),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return serverError(err, 'public_mine');
  }
}
