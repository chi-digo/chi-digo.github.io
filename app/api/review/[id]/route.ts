import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PAYLOADS, reviewSchema, type ContributionType } from '@/lib/contributions/schemas';
import {
  getCaller, canReview, forbidden, badRequest, rpc, rpcError, serverError, refreshOverlay, overlayArea,
} from '@/lib/contributions/server';
import { getAreaOverlay } from '@/lib/contributions/overlay';
import { resolveTarget } from '@/lib/contributions/targets';
import { warningsFor, needsSecondReview, variantRequired, targetChanged, type ReviewRow } from '@/lib/contributions/review';

const COLUMNS = 'id, user_id, type, scope, target_type, target_id, target_path, target_label, payload, final_payload, note, region, village, confidence, recorded_for, credit_opt_in, locale, page_path, status, live_status, fold_status, fold_error, outcome, base, held, hidden_at, reply, review_note, agree_count, raw_agree_count, claimed_by, claimed_until, reviewer_id, is_test, created_at, reviewed_at';

async function load(db: SupabaseClient, id: string) {
  const { data } = await db.from('contributions').select(COLUMNS).eq('id', id).maybeSingle();
  return data;
}

/** One item with everything a reviewer needs: current text, other suggestions, warnings (spec §8.2). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return badRequest('invalid id');
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  try {
    const row = await load(caller.db, id);
    if (!row || row.is_test !== caller.isTest) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (!canReview(caller, row.scope)) return forbidden();

    const liveChanges = row.target_type === 'plant' ? await getAreaOverlay('plant') : [];
    const current = resolveTarget(row.type, row.target_type ?? undefined, row.target_id ?? undefined, row.payload, {
      isTest: row.is_test,
      liveChanges,
    });
    const [{ data: others }, { data: agreements }, { data: history }] = await Promise.all([
      row.target_id
        ? caller.db.from('contributions').select('id, type, payload, region, confidence, status, agree_count, created_at')
            .eq('target_type', row.target_type).eq('target_id', row.target_id).eq('scope', row.scope)
            .eq('is_test', row.is_test).neq('id', id)
            .in('status', ['pending', 'needs_info', 'accepted']).order('created_at')
        : Promise.resolve({ data: [] }),
      caller.db.from('contribution_agreements').select('region, confidence, counted').eq('contribution_id', id),
      row.user_id
        ? caller.db.from('contributions').select('status').eq('user_id', row.user_id)
        : Promise.resolve({ data: [] }),
    ]);
    const { data: who } = row.user_id
      ? await caller.db.from('profiles').select('first_name').eq('id', row.user_id).maybeSingle()
      : { data: null };

    const { user_id, ...item } = row;
    return NextResponse.json(
      {
        item,
        contributor: {
          first_name: who?.first_name ?? null,
          submitted: (history ?? []).length,
          accepted: (history ?? []).filter((h) => h.status === 'accepted').length,
          is_you: user_id === caller.id,
        },
        current: current ? { label: current.label, value: current.base?.value ?? null } : null,
        changed: targetChanged(row as unknown as ReviewRow, liveChanges),
        warnings: warningsFor(row.type, (row.final_payload ?? row.payload) as Record<string, unknown>),
        // An admin alone may confirm their own accept when nobody else could (owner decision 2026-10-16).
        can_self_confirm: row.live_status === 'awaiting_second'
          ? await rpc<boolean>(caller.db, 'can_self_confirm', { p_uid: caller.id, p_cid: id })
          : false,
        agreements: agreements ?? [],
        others: others ?? [],
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return serverError(err, 'review_get');
  }
}

/** Decide an item: accept (as replacement or regional variant), ask, decline, mark duplicate, revert… */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return badRequest('invalid id');
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('invalid', parsed.error.issues);
  const body = parsed.data;

  try {
    const row = await load(caller.db, id);
    if (!row || row.is_test !== caller.isTest) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (!canReview(caller, row.scope)) return forbidden();
    if (row.user_id === caller.id) return forbidden('self_review');

    const args: Record<string, unknown> = { note: body.note ?? null };
    const area = overlayArea(row.target_type);

    if (body.action === 'accept' || body.action === 'accept_variant') {
      const final = PAYLOADS[row.type as ContributionType].safeParse(body.final_payload ?? row.payload);
      if (!final.success) return badRequest('invalid', final.error.issues);
      const finalPayload = final.data as Record<string, unknown>;

      const { ruled_out } = warningsFor(row.type, finalPayload);
      if (ruled_out.length) return NextResponse.json({ error: 'ruled_out', hits: ruled_out }, { status: 422 });

      const liveChanges = area ? await getAreaOverlay(area) : [];
      if (targetChanged(row as unknown as ReviewRow, liveChanges)) {
        return NextResponse.json({ error: 'target_changed' }, { status: 409 });
      }
      if (body.action === 'accept' && (await variantRequired(caller.db, row as unknown as ReviewRow, liveChanges))) {
        return NextResponse.json({ error: 'variant_required' }, { status: 422 });
      }
      args.final_payload = finalPayload;
      args.needs_second = needsSecondReview(row as unknown as ReviewRow, finalPayload, liveChanges);
      if (body.merge_ids) args.merge_ids = body.merge_ids;
    }
    if (body.action === 'duplicate') args.duplicate_of = body.duplicate_of ?? null;
    if (body.action === 'retry_fold') {
      // Editing accepted text is an admin action, gets the same Digo check as an accept, and is
      // confirmed by a second reviewer before it goes live again (the database enforces the last part).
      if (body.final_payload) {
        if (caller.role !== 'admin') return forbidden();
        const final = PAYLOADS[row.type as ContributionType].safeParse(body.final_payload);
        if (!final.success) return badRequest('invalid', final.error.issues);
        const { ruled_out } = warningsFor(row.type, final.data as Record<string, unknown>);
        if (ruled_out.length) return NextResponse.json({ error: 'ruled_out', hits: ruled_out }, { status: 422 });
        args.final_payload = final.data;
      }
      // A conflict is resolved against the text as it is now (published data plus the other live changes).
      if (row.live_status === 'conflict') {
        const others = area ? (await getAreaOverlay(area)).filter((c) => c.contribution_id !== row.id) : [];
        const now = resolveTarget(row.type, row.target_type ?? undefined, row.target_id ?? undefined,
          (args.final_payload ?? row.final_payload ?? row.payload) as Record<string, unknown>, { isTest: row.is_test, liveChanges: others });
        if (now?.base) args.base = now.base;
      }
    }

    const result = body.action === 'self_confirm'
      ? await rpc<{ ok?: boolean; error?: string; status?: string; live_status?: string }>(caller.db, 'admin_self_confirm', { p_uid: caller.id, p_cid: id })
      : await rpc<{ ok?: boolean; error?: string; status?: string; live_status?: string }>(
          caller.db, 'review_transition', { p_uid: caller.id, p_cid: id, p_action: body.action, p_args: args },
        );
    if (result.error) return rpcError(result.error);

    if (['accept', 'accept_variant', 'second_confirm', 'self_confirm', 'revert', 'retry_fold'].includes(body.action)) refreshOverlay(area);
    return NextResponse.json({ status: result.status, live_status: result.live_status });
  } catch (err) {
    return serverError(err, 'review_post');
  }
}
