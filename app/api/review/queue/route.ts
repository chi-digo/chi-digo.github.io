import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SCOPES, TYPES, REGIONS, CONFIDENCE, type Scope } from '@/lib/contributions/schemas';
import { getCaller, forbidden, isReviewer, badRequest, serverError } from '@/lib/contributions/server';
import { getAreaOverlay } from '@/lib/contributions/overlay';
import { targetChanged, type ReviewRow } from '@/lib/contributions/review';

const query = z.object({
  scope: z.enum(SCOPES).optional(),
  type: z.enum(TYPES as [string, ...string[]]).optional(),
  view: z.enum(['open', 'attention', 'live']).default('open'),
  region: z.enum(REGIONS).optional(),
  confidence: z.enum(CONFIDENCE).optional(),
});

const STALE_MS = 14 * 86_400_000;

/** The review queue within the caller's scopes, grouped by target, oldest first (spec §8.1). */
export async function GET(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (!isReviewer(caller)) return forbidden();
  const q = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!q.success) return badRequest('invalid', q.error.issues);

  const allowed: Scope[] = caller.role === 'admin' || caller.scopes.includes('all')
    ? [...SCOPES]
    : SCOPES.filter((s) => caller.scopes.includes(s));
  const scopes = q.data.scope ? allowed.filter((s) => s === q.data.scope) : allowed;
  if (!scopes.length) return NextResponse.json({ groups: [] });

  try {
    let sel = caller.db
      .from('contributions')
      .select('id, user_id, type, scope, target_type, target_id, target_label, payload, region, village, confidence, recorded_for, locale, status, live_status, fold_status, fold_error, agree_count, raw_agree_count, base, held, hidden_at, claimed_by, claimed_until, reply, review_note, is_test, created_at, profiles!contributions_user_id_fkey(first_name)')
      .in('scope', scopes)
      .order('created_at', { ascending: true })
      .limit(150);
    if (q.data.view === 'open') sel = sel.in('status', ['pending', 'needs_info']);
    if (q.data.view === 'attention') sel = sel.eq('status', 'accepted').or('live_status.in.(awaiting_second,conflict),fold_status.eq.failed');
    if (q.data.view === 'live') sel = sel.eq('status', 'accepted').eq('live_status', 'live');
    if (q.data.type) sel = sel.eq('type', q.data.type);
    if (q.data.region) sel = sel.eq('region', q.data.region);
    if (q.data.confidence) sel = sel.eq('confidence', q.data.confidence);
    sel = sel.eq('is_test', caller.isTest);
    const { data: rows, error } = await sel;
    if (error) return serverError(error, 'queue');

    // Each contributor's record helps reviewers weigh a suggestion.
    const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter(Boolean))] as string[];
    const { data: history } = userIds.length
      ? await caller.db.from('contributions').select('user_id, status').in('user_id', userIds)
      : { data: [] };
    const record = (uid: string | null) => {
      const own = (history ?? []).filter((h) => h.user_id === uid);
      return { submitted: own.length, accepted: own.filter((h) => h.status === 'accepted').length };
    };

    const plantChanges = await getAreaOverlay('plant');
    const now = Date.now();
    const groups = new Map<string, { target_type: string | null; target_id: string | null; target_label: string | null; items: unknown[] }>();
    for (const r of rows ?? []) {
      const key = `${r.target_type}:${r.target_id ?? r.id}`;
      if (!groups.has(key)) groups.set(key, { target_type: r.target_type, target_id: r.target_id, target_label: r.target_label, items: [] });
      const { profiles, user_id, ...rest } = r as typeof r & { profiles: { first_name: string | null } | null };
      groups.get(key)!.items.push({
        ...rest,
        contributor: { first_name: profiles?.first_name ?? null, ...record(user_id), is_you: user_id === caller.id },
        stale: now - new Date(r.created_at).getTime() > STALE_MS,
        claimed_by_other: !!r.claimed_by && r.claimed_by !== caller.id && new Date(r.claimed_until ?? 0).getTime() > now,
        changed: targetChanged(r as unknown as ReviewRow, plantChanges),
      });
    }
    return NextResponse.json({ groups: [...groups.values()] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return serverError(err, 'queue');
  }
}
