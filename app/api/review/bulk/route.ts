import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { bulkReviewSchema } from '@/lib/contributions/schemas';
import { getCaller, canReview, badRequest, rpc, serverError, refreshOverlay, overlayArea, readsLanguage } from '@/lib/contributions/server';
import { loadAreaOverlay } from '@/lib/contributions/overlay';
import { acceptArgs } from '@/lib/contributions/decide';
import { resolveTarget } from '@/lib/contributions/targets';
import type { Change } from '@/lib/contributions/apply/types';
import type { ReviewRow } from '@/lib/contributions/review';
import en from '@/lib/i18n/messages/en.json';
import sw from '@/lib/i18n/messages/sw.json';
import dg from '@/lib/i18n/messages/dg.json';

export const maxDuration = 120;

const COLUMNS = 'id, user_id, type, scope, target_type, target_id, target_path, target_label, payload, final_payload, region, confidence, locale, status, live_status, fold_status, base, claimed_by, claimed_until, reviewer_id, is_test, created_at';
const MESSAGES = { en, sw, dg } as const;

type Row = ReviewRow & {
  id: string; user_id: string | null; type: string; scope: string; target_type: string | null; target_id: string | null;
  target_path: string | null; target_label: string | null; payload: Record<string, unknown>; final_payload: Record<string, unknown> | null; region: string | null;
  confidence: string | null; locale: 'en' | 'sw' | 'dg'; status: string; live_status: string | null; fold_status: string | null;
  base: { value: unknown } | null; claimed_by: string | null; claimed_until: string | null; reviewer_id: string | null; is_test: boolean;
};
type Result = {
  id: string; ok: boolean; would?: 'live' | 'awaiting_second' | 'paused'; status?: string; live_status?: string; error?: string;
  /** Accepted, but confirming alone failed: it waits for a second reviewer. */
  confirm_failed?: string;
  /** For the review sheet (dry run): what is changed, from what, to what, and why. */
  item?: { label: string | null; lang: unknown; current: string | null; proposed: unknown; source: string | null; swahili: string | null; reason: unknown };
};

/** What the review sheet shows for one fix: its label, the text now, the proposal, the English source. */
function describe(row: Row, live: Change[]): Result['item'] {
  const payload = row.final_payload ?? row.payload;
  const t = resolveTarget(row.type as never, row.target_type ?? undefined, row.target_id ?? undefined, payload, { isTest: row.is_test, liveChanges: live });
  const current = (t?.base?.value as { text?: string } | undefined)?.text ?? (row.base?.value as { text?: string } | undefined)?.text ?? null;
  return {
    label: t?.label ?? row.target_label, lang: payload.lang, current, proposed: payload.proposed,
    source: t?.source ?? null, swahili: t?.swahili ?? null, reason: payload.reason,
  };
}

/** Two fixes to the same text can't both go in one run: the later one is skipped (§19.1). Interface text by key. */
const targetKey = (r: Row) =>
  r.target_type === 'ui' ? `ui::${r.target_path}:${r.payload.lang}` : `${r.target_type}:${r.target_id}:${r.target_path}:${r.payload.lang}`;

/**
 * Bulk review of translation fixes (spec 34 §19.1): accept, accept and confirm alone, confirm, or decline up
 * to 50, each through exactly the checks a single decision has. `dry_run` answers what would happen.
 */
export async function POST(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  const parsed = bulkReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('invalid', parsed.error.issues);
  const body = parsed.data;
  if (caller.blocked || (caller.role !== 'admin' && caller.role !== 'reviewer')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (body.action === 'decline' && !body.reason) return badRequest('reason_required');

  const db = caller.db;
  const touched = new Set<string>();
  const decided: string[] = [];
  try {
    const { data, error } = await db.from('contributions').select(COLUMNS).in('id', body.ids)
      .eq('is_test', caller.isTest).eq('type', 'translation_fix').order('created_at');
    if (error) throw error;
    const rows = (data ?? []) as unknown as Row[];
    const found = new Set(rows.map((r) => r.id));
    const results: Result[] = body.ids.filter((id) => !found.has(id)).map((id) => ({ id, ok: false, error: 'not_found' }));

    const { data: setting } = await db.from('app_settings').select('value').eq('key', 'ui_self_confirm').maybeSingle();
    // Read the switch as the database does (a boolean, or the text "true").
    const confirmAlone = caller.role === 'admin' && String(setting?.value) === 'true';
    const { data: pause } = await db.from('app_settings').select('value').eq('key', 'publishing_paused').maybeSingle();
    const paused = String(pause?.value) === 'true' && !caller.isTest;
    if (body.action === 'accept_confirm' && !confirmAlone) return badRequest('confirm_alone_off');

    // Accepts left this hour (the database enforces it; this is for the review sheet).
    const cap = caller.role === 'admin' ? 150 : 60;
    const { count } = await db.from('contribution_events').select('id', { count: 'exact', head: true })
      .eq('actor_id', caller.id).in('action', ['accept', 'accept_variant']).gt('created_at', new Date(Date.now() - 3_600_000).toISOString());
    let acceptsLeft = Math.max(0, cap - (count ?? 0));

    // Each area's live changes, read once and kept current as this run accepts (§19.1).
    const overlays = new Map<string, Change[]>();
    const overlayFor = async (area: string | null) => {
      if (!area) return [];
      if (!overlays.has(area)) overlays.set(area, await loadAreaOverlay(area));
      return overlays.get(area)!;
    };
    // Interface keys that already have an accepted fix not yet in the files.
    const { data: pendingUi } = await db.from('contributions').select('target_path, final_payload')
      .eq('type', 'translation_fix').eq('target_type', 'ui').eq('status', 'accepted').eq('is_test', caller.isTest)
      .in('live_status', ['awaiting_second', 'live', 'paused']).or('fold_status.is.null,fold_status.neq.folded');
    const seen = new Set((pendingUi ?? []).map((r) => `ui::${r.target_path}:${(r.final_payload as Record<string, unknown> | null)?.lang}`));

    let stopped = false;
    let declinesLeft = 100;
    if (body.action === 'decline') {
      const { count: declined } = await db.from('contribution_events').select('id', { count: 'exact', head: true })
        .eq('actor_id', caller.id).eq('action', 'decline').gt('created_at', new Date(Date.now() - 3_600_000).toISOString());
      declinesLeft = Math.max(0, 100 - (declined ?? 0));
    }
    try {
      for (const row of rows) {
        // Only a fix the caller may review is described back (its text, reason and source).
        let mayDescribe = false;
        const skip = async (error: string) => {
          results.push({ id: row.id, ok: false, error, ...(body.dry_run && mayDescribe && { item: describe(row, await overlayFor(area)) }) });
        };
        const area = overlayArea(row.target_type);
        if (stopped) { await skip('not_attempted'); continue; }
        if (!canReview(caller, row.scope as never) || !readsLanguage(caller, row)) { await skip('forbidden'); continue; }
        if (row.user_id === caller.id) { await skip('self_review'); continue; }
        if (row.claimed_by && row.claimed_by !== caller.id && row.claimed_until && new Date(row.claimed_until) > new Date()) { await skip('claimed'); continue; }
        mayDescribe = true;
        try {
          if (body.action === 'accept' || body.action === 'accept_confirm') {
            if (!['pending', 'needs_info'].includes(row.status)) { await skip('already_decided'); continue; }
            if (seen.has(targetKey(row))) { await skip('same_target_in_batch'); continue; }
            // The hourly cap: the first item over it, then the rest aren't tried (in a dry run too).
            if (acceptsLeft <= 0) { await skip('rate_cap'); stopped = true; continue; }
            const live = await overlayFor(area);
            const prepared = await acceptArgs(db, row, { action: 'accept' }, live);
            if ('error' in prepared) { await skip(prepared.error); continue; }
            const twoVoices = !!prepared.args.needs_second || row.target_type === 'ui';
            const would = twoVoices && body.action !== 'accept_confirm' ? 'awaiting_second' : paused ? 'paused' : 'live';
            if (body.dry_run) {
              seen.add(targetKey(row));
              acceptsLeft--;
              results.push({ id: row.id, ok: true, would, item: describe(row, live) });
              continue;
            }
            let r = await rpc<{ error?: string; status?: string; live_status?: string }>(db, 'review_transition',
              { p_uid: caller.id, p_cid: row.id, p_action: 'accept', p_args: { ...prepared.args, note: null, quiet: true } });
            if (r.error) { await skip(r.error); if (r.error === 'rate_cap') stopped = true; continue; }
            seen.add(targetKey(row));
            acceptsLeft--;
            decided.push(row.id);
            let confirmFailed: string | undefined;
            if (body.action === 'accept_confirm' && r.live_status === 'awaiting_second') {
              const c = await rpc<{ error?: string; status?: string; live_status?: string }>(db, 'admin_self_confirm', { p_uid: caller.id, p_cid: row.id });
              if (c.error) confirmFailed = c.error;
              else r = c;
            }
            if (area && r.live_status === 'live') {
              // Later items in this run are checked against this accept too.
              live.push({
                contribution_id: row.id, type: 'translation_fix', target_type: row.target_type, target_id: row.target_id ?? '',
                target_path: row.target_path, final_payload: prepared.args.final_payload as Record<string, unknown>, outcome: 'replace',
                region: row.region as never, confidence: row.confidence as never, edited: false, base: row.base ? { value: row.base.value } : null,
              });
              touched.add(area);
            }
            results.push({ id: row.id, ok: true, status: r.status, live_status: r.live_status, ...(confirmFailed && { confirm_failed: confirmFailed }) });
            continue;
          }

          if (body.action === 'confirm') {
            if (row.status !== 'accepted' || row.live_status !== 'awaiting_second') { await skip('already_decided'); continue; }
            let action: 'self_confirm' | 'second_confirm' = 'second_confirm';
            if (row.reviewer_id === caller.id) {
              const alone = await rpc<boolean>(db, 'can_self_confirm', { p_uid: caller.id, p_cid: row.id });
              if (!alone) { await skip('own_accept'); continue; }
              action = 'self_confirm';
            }
            if (body.dry_run) { results.push({ id: row.id, ok: true, would: paused ? 'paused' : 'live', item: describe(row, await overlayFor(area)) }); continue; }
            const r = action === 'self_confirm'
              ? await rpc<{ error?: string; status?: string; live_status?: string }>(db, 'admin_self_confirm', { p_uid: caller.id, p_cid: row.id })
              : await rpc<{ error?: string; status?: string; live_status?: string }>(db, 'review_transition', { p_uid: caller.id, p_cid: row.id, p_action: 'second_confirm', p_args: {} });
            if (r.error) { await skip(r.error); continue; }
            if (area) touched.add(area);
            results.push({ id: row.id, ok: true, status: r.status, live_status: r.live_status });
            continue;
          }

          // Decline, with a preset reason in the contributor's language (owner decision 9). At most 100 an hour.
          if (!['pending', 'needs_info'].includes(row.status)) { await skip('already_decided'); continue; }
          if (declinesLeft <= 0) { await skip('rate_cap'); stopped = true; continue; }
          if (body.dry_run) {
            declinesLeft--;
            results.push({ id: row.id, ok: true, item: describe(row, await overlayFor(area)) });
            continue;
          }
          const key = `decline_${body.reason}` as keyof typeof en.contribute;
          const preset = (MESSAGES[row.locale] ?? en).contribute[key] || en.contribute[key];
          const note = [preset, body.note?.trim()].filter(Boolean).join(' ');
          const r = await rpc<{ error?: string; status?: string }>(db, 'review_transition',
            { p_uid: caller.id, p_cid: row.id, p_action: 'decline', p_args: { note, quiet: true, bulk_reason: body.reason } });
          if (r.error) { await skip(r.error); if (r.error === 'rate_cap') stopped = true; continue; }
          declinesLeft--;
          decided.push(row.id);
          results.push({ id: row.id, ok: true, status: r.status });
        } catch (err) {
          // One item failing (a database error) stops the run here; what was decided is kept and reported.
          Sentry.captureException(err, { tags: { feature: 'contributions', context: 'review_bulk_item' } });
          await skip('server_error');
          stopped = true;
        }
      }
    } finally {
      // Whatever was decided is told to its contributors, even if the run stopped early.
      if (!body.dry_run && decided.length) {
        try {
          await rpc(db, 'notify_batch', { p_cids: decided });
          const { error: logError } = await db.from('contribution_events').insert({ actor_id: caller.id, action: 'bulk', details: { action: body.action, count: decided.length }, is_test: caller.isTest });
          if (logError) Sentry.captureMessage(`bulk event: ${logError.message}`, { level: 'warning' });
        } catch (err) {
          Sentry.captureException(err, { tags: { feature: 'contributions', context: 'review_bulk_notify' } });
        }
      }
    }
    // Keep the answer in the order the reviewer selected.
    const order = new Map(body.ids.map((id, i) => [id, i]));
    results.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return NextResponse.json({ results, accepts_left: acceptsLeft }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return serverError(err, 'review_bulk');
  } finally {
    for (const area of touched) refreshOverlay(area);
  }
}
