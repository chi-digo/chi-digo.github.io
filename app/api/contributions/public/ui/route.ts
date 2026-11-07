import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCaller, serverError } from '@/lib/contributions/server';

const TEST_KEY = '__test__.label';

/**
 * Interface-text fixes for one language (spec 34 §19.2): open ones, to agree with instead of repeating, and
 * accepted ones waiting for the next update. Found by key: one key shows on many pages. Only `lang` (and,
 * for test accounts, `test=1`) is accepted, so the 5-second CDN cache can't be bypassed.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang');
  const test = url.searchParams.get('test') === '1';
  if ((lang !== 'sw' && lang !== 'dg') || [...url.searchParams.keys()].some((k) => k !== 'lang' && k !== 'test')) {
    return NextResponse.json({ error: 'lang must be sw or dg' }, { status: 400 });
  }
  try {
    if (test) {
      // The automated tests' own world: only test rows on the test key, for a signed-in test account.
      const caller = await getCaller();
      if (caller instanceof NextResponse || !caller.isTest) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      const { data, error } = await caller.db.from('contributions').select('id, target_path, payload, agree_count, region, created_at')
        .eq('type', 'translation_fix').eq('target_type', 'ui').eq('is_test', true).eq('target_path', TEST_KEY)
        .in('status', ['pending', 'needs_info']).is('hidden_at', null).eq('payload->>lang', lang).order('created_at').limit(50);
      if (error) throw error;
      return NextResponse.json({
        open: (data ?? []).map((r) => ({ id: r.id, key: r.target_path, proposed: (r.payload as Record<string, unknown>).proposed, agree_count: r.agree_count, region: r.region })),
        accepted: [],
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const [open, accepted] = await Promise.all([
      anon.from('public_contributions').select('id, target_path, public_payload, agree_count, region, created_at')
        .eq('type', 'translation_fix').eq('target_type', 'ui').eq('public_payload->>lang', lang)
        .neq('target_id', '__test__').neq('target_path', TEST_KEY).order('created_at').limit(200),
      anon.from('public_ui_accepted').select('key, proposed').eq('lang', lang).limit(200),
    ]);
    if (open.error) throw open.error;
    if (accepted.error) throw accepted.error;
    return NextResponse.json({
      open: (open.data ?? []).map((r) => ({
        id: r.id, key: r.target_path, proposed: (r.public_payload as Record<string, unknown>).proposed, agree_count: r.agree_count, region: r.region,
      })),
      accepted: accepted.data ?? [],
    }, { headers: { 'Cache-Control': 'no-cache', 'CDN-Cache-Control': 'public, s-maxage=5' } });
  } catch (err) {
    return serverError(err, 'public_ui');
  }
}
