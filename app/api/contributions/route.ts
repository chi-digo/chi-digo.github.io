import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PAYLOADS, TYPE_SCOPE, ENABLED_TYPES, submitSchema } from '@/lib/contributions/schemas';
import { getCaller, badRequest, forbidden, rpc, rpcError, serverError } from '@/lib/contributions/server';
import { resolveTarget, WORD_ID, similarHeadwords } from '@/lib/contributions/targets';
import { getAreaOverlay } from '@/lib/contributions/overlay';
import { normaliseDigo } from '@/lib/contributions/text';
import { TEST_TARGET } from '@/lib/contributions/schemas';

/** Submit a contribution (spec 34 technical §4.1). Limits and visibility are applied in the database. */
export async function POST(request: Request) {
  const caller = await getCaller();
  if (caller instanceof NextResponse) return caller;
  if (caller.blocked) return forbidden('blocked');

  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest('invalid', parsed.error.issues);
  const { force_new, ...input } = parsed.data;
  if (!ENABLED_TYPES.includes(input.type)) return badRequest('type_not_enabled');

  const payload = PAYLOADS[input.type].safeParse(input.payload);
  if (!payload.success) return badRequest('invalid', payload.error.issues);

  // Feedback is always about a page; test accounts may only touch the fixture plant.
  if (input.type === 'general_feedback') {
    input.target_type = 'page';
    input.target_id = input.page_path ?? '/';
  }
  // Dictionary types always target a word: a new word has no id yet; anything else names an existing
  // entry (or, for a flag only, a provisional new word c:<uuid>). Test new words use the headword __test__.
  if (TYPE_SCOPE[input.type] === 'dictionary') {
    input.target_type = 'word';
    if (input.type === 'word_addition') {
      const headword = String((payload.data as { headword: string }).headword);
      if ((headword === TEST_TARGET) !== caller.isTest) return forbidden('test_account_target');
      input.target_id = caller.isTest ? TEST_TARGET : undefined;
    } else {
      const id = input.target_id ?? '';
      const ok = id === TEST_TARGET || WORD_ID.test(id) || (input.type === 'entry_flag' && /^c:[0-9a-f-]{36}$/.test(id));
      if (!ok) return badRequest('invalid_target');
    }
  }
  if (caller.isTest && input.type !== 'general_feedback' && input.target_id !== TEST_TARGET) {
    return forbidden('test_account_target');
  }

  try {
    const area = input.target_type === 'plant' ? 'plant' : input.target_type === 'word' ? 'word' : null;
    const target = resolveTarget(input.type, input.target_type, input.target_id, payload.data, {
      isTest: caller.isTest,
      liveChanges: area ? await getAreaOverlay(area) : [],
    });
    if (!target) return NextResponse.json({ error: 'target_not_found' }, { status: 404 });

    // A plant name someone already suggested: ask "is it the same?" instead of filing a duplicate.
    if (input.type === 'plant_name' && !force_new) {
      const name = normaliseDigo((payload.data as { name: string }).name);
      const { data: open, error: openError } = await caller.db
        .from('public_contributions')
        .select('id, public_payload')
        .eq('type', 'plant_name')
        .eq('target_id', input.target_id!);
      if (openError) return serverError(openError, 'similar');
      const matches = (open ?? []).filter((c) => normaliseDigo(String(c.public_payload?.name ?? '')) === name);
      // The caller's own earlier suggestion isn't "someone else's": skip it (they can't agree with it).
      const { data: owners } = matches.length
        ? await caller.db.from('contributions').select('id, user_id').in('id', matches.map((m) => m.id))
        : { data: [] };
      const similar = matches.find((m) => owners?.find((o) => o.id === m.id)?.user_id !== caller.id);
      if (similar) {
        return NextResponse.json({ inserted: false, similar: { id: similar.id, name: similar.public_payload.name } });
      }
    }

    // A new word that may already exist: in the dictionary (by headword or variant) or as an open suggestion.
    if (input.type === 'word_addition' && !force_new && !caller.isTest) {
      const headword = String((payload.data as { headword: string }).headword);
      const existing = similarHeadwords(headword);
      if (existing) {
        return NextResponse.json({ inserted: false, similar: { name: existing, href: `/language/dictionary/word/${encodeURIComponent(existing)}` } });
      }
      const { data: open, error: openError } = await caller.db
        .from('public_contributions')
        .select('id, public_payload')
        .eq('type', 'word_addition');
      if (openError) return serverError(openError, 'similar');
      const key = normaliseDigo(headword);
      // A new word already accepted (live, not folded in yet) is linked like a dictionary word.
      const live = (await getAreaOverlay('word')).find((c) => c.type === 'word_addition' && normaliseDigo(String(c.final_payload.headword ?? '')) === key);
      if (live) {
        const name = String(live.final_payload.headword);
        return NextResponse.json({ inserted: false, similar: { name, href: `/language/dictionary/word/${encodeURIComponent(name)}` } });
      }
      const match = (open ?? []).find((c) => normaliseDigo(String(c.public_payload?.headword ?? '')) === key);
      if (match) return NextResponse.json({ inserted: false, similar: { id: match.id, name: match.public_payload.headword } });
    }

    const result = await rpc<{ id?: string; held?: boolean; error?: string }>(caller.db, 'submit_contribution', {
      p_uid: caller.id,
      p_row: {
        ...input,
        payload: payload.data,
        scope: TYPE_SCOPE[input.type],
        target_label: target.label,
        target_path: target.path,
        base: target.base ?? null,
      },
    });
    if (result.error) return rpcError(result.error);
    return NextResponse.json({ inserted: true, id: result.id, held: result.held }, { status: 201 });
  } catch (err) {
    return serverError(err, 'submit');
  }
}

/** The caller's own contributions, newest first, without reviewer identities. */
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('mine') !== '1') return badRequest('use ?mine=1');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('my_contributions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return serverError(error, 'mine');
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
