import { NextResponse } from 'next/server';
import { z } from 'zod';
import { REVIEW_SCOPES } from '@/lib/contributions/schemas';
import { getCaller, badRequest, forbidden, logEvent, serverError } from '@/lib/contributions/server';
import { loadUsers, searchUsers } from '@/lib/contributions/admin';

/** Reviewers, admins and blocked users; or a user search with ?q= (spec §3.1). ?reveal=<id> unmasks one email. */
export async function GET(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.role !== 'admin' || caller.blocked) return forbidden();
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const reveal = url.searchParams.get('reveal') ?? undefined;
  if (reveal && !z.string().uuid().safeParse(reveal).success) return badRequest('invalid reveal');

  try {
    if (q) {
      await logEvent(caller, { action: 'admin_search', details: { q: q.slice(0, 60) } });
      return NextResponse.json({ results: await searchUsers(caller.db, q) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (reveal) await logEvent(caller, { action: 'reveal_email', subject_user_id: reveal });
    const { data: staff } = await caller.db.from('profiles').select('id').or('role.in.(reviewer,admin),blocked_at.not.is.null');
    const ids = (staff ?? []).map((s) => s.id);
    if (reveal && !ids.includes(reveal)) ids.push(reveal);
    const users = await loadUsers(caller.db, ids, reveal);
    return NextResponse.json(
      {
        admins: users.filter((u) => u.role === 'admin'),
        reviewers: users.filter((u) => u.role === 'reviewer'),
        blocked: users.filter((u) => u.blocked),
        revealed: reveal ? users.find((u) => u.id === reveal) ?? null : null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return serverError(err, 'reviewers_get');
  }
}

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('grant'), user_id: z.string().uuid(), scopes: z.array(z.enum(REVIEW_SCOPES)).min(1),
    // The translation languages they read (spec 34 §17, decision 5); omitted keeps the current ones.
    languages: z.array(z.enum(['sw', 'dg'])).max(2).optional(),
  }),
  z.object({ action: z.literal('remove'), user_id: z.string().uuid() }),
]);

/** Make someone a reviewer (or change their scopes), or remove the role. Takes effect immediately. */
export async function POST(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.role !== 'admin' || caller.blocked) return forbidden();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('invalid', parsed.error.issues);
  const body = parsed.data;
  const { db } = caller;

  try {
    const { data: target } = await db.from('profiles').select('role, blocked_at').eq('id', body.user_id).is('deleted_at', null).single();
    if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (target.role === 'admin') return forbidden('is_admin');
    if (target.blocked_at) return forbidden('is_blocked');

    if (body.action === 'grant') {
      const scopes = body.scopes.includes('all') ? ['all'] : body.scopes;
      await db.from('profile_review_scopes').delete().eq('user_id', body.user_id);
      const { error: scopeError } = await db.from('profile_review_scopes')
        .insert(scopes.map((scope) => ({ user_id: body.user_id, scope, granted_by: caller.id })));
      const { error } = await db.from('profiles').update({ role: 'reviewer' }).eq('id', body.user_id);
      if (error || scopeError) return serverError(error ?? scopeError, 'grant');
      if (body.languages) {
        await db.from('profile_review_languages').delete().eq('user_id', body.user_id);
        const langs = [...new Set(body.languages)];
        const { error: langError } = langs.length
          ? await db.from('profile_review_languages').insert(langs.map((lang) => ({ user_id: body.user_id, lang, granted_by: caller.id })))
          : { error: null };
        if (langError) return serverError(langError, 'grant_languages');
      }
      await logEvent(caller, {
        action: target.role === 'reviewer' ? 'update_scopes' : 'grant_reviewer',
        subject_user_id: body.user_id,
        details: { scopes, ...(body.languages && { languages: body.languages }) },
      });
      return NextResponse.json({ role: 'reviewer', scopes, languages: body.languages });
    }

    await db.from('profile_review_scopes').delete().eq('user_id', body.user_id);
    await db.from('profile_review_languages').delete().eq('user_id', body.user_id);
    const { error } = await db.from('profiles').update({ role: 'member' }).eq('id', body.user_id);
    if (error) return serverError(error, 'remove');
    await logEvent(caller, { action: 'remove_reviewer', subject_user_id: body.user_id });
    return NextResponse.json({ role: 'member', scopes: [] });
  } catch (err) {
    return serverError(err, 'reviewers_post');
  }
}
