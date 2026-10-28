import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCaller, forbidden, badRequest, rpc, rpcError, serverError, refreshOverlay } from '@/lib/contributions/server';

/** Publishing switch, fold-in request and the last fold-in runs (spec 34 technical §4.2, §10). */
export async function GET() {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.role !== 'admin' || caller.blocked) return forbidden();
  try {
    const [{ data: settings }, { data: runs }] = await Promise.all([
      caller.db.from('app_settings').select('key, value, updated_at'),
      caller.db.from('contribution_events').select('action, details, created_at')
        .like('action', 'fold_%').order('created_at', { ascending: false }).limit(20),
    ]);
    const get = (k: string) => settings?.find((s) => s.key === k)?.value ?? null;
    return NextResponse.json(
      {
        publishing_paused: get('publishing_paused') === true, fold_requested_at: get('fold_requested_at'), fold_events: runs ?? [],
        // Whether an admin may confirm an interface fix alone (spec 34 §17.12; off by default).
        ui_self_confirm: get('ui_self_confirm') === true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return serverError(err, 'settings_get');
  }
}

const bodySchema = z.object({ publishing_paused: z.boolean().optional(), fold_now: z.literal(true).optional(), ui_self_confirm: z.boolean().optional() });

export async function POST(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.role !== 'admin' || caller.blocked) return forbidden();
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest('invalid', body.error.issues);
  try {
    const out: Record<string, unknown> = {};
    if (body.data.publishing_paused !== undefined) {
      const r = await rpc<{ error?: string; paused?: boolean; released?: number }>(caller.db, 'set_publishing_paused', {
        p_uid: caller.id, p_paused: body.data.publishing_paused,
      });
      if (r.error) return rpcError(r.error);
      refreshOverlay();
      Object.assign(out, r);
    }
    if (body.data.ui_self_confirm !== undefined) {
      const { error } = await caller.db.from('app_settings')
        .upsert({ key: 'ui_self_confirm', value: body.data.ui_self_confirm, updated_by: caller.id, updated_at: new Date().toISOString() });
      if (error) return serverError(error, 'ui_self_confirm');
      await caller.db.from('contribution_events').insert({ actor_id: caller.id, action: 'set_ui_self_confirm', details: { on: body.data.ui_self_confirm } });
      out.ui_self_confirm = body.data.ui_self_confirm;
    }
    if (body.data.fold_now) {
      const { error } = await caller.db.from('app_settings')
        .update({ value: new Date().toISOString(), updated_by: caller.id, updated_at: new Date().toISOString() })
        .eq('key', 'fold_requested_at');
      if (error) return serverError(error, 'fold_now');
      await caller.db.from('contribution_events').insert({ actor_id: caller.id, action: 'fold_requested' });
      out.fold_requested = true;
    }
    return NextResponse.json(out);
  } catch (err) {
    return serverError(err, 'settings_post');
  }
}
