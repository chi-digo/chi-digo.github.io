import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TARGET_TYPES } from '@/lib/contributions/schemas';
import { serverError } from '@/lib/contributions/server';

/**
 * Open suggestions for one item, for the "Suggestions under review" panel (spec §6). Identical for
 * every visitor, so the CDN can cache it; the caller's own agree/report flags come from /public/mine.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetType = url.searchParams.get('target_type');
  const targetId = url.searchParams.get('target_id');
  if (!targetType || !targetId || !(TARGET_TYPES as readonly string[]).includes(targetType) || targetId.length > 200) {
    return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 });
  }

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await anon
    .from('public_contributions')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('agree_count', { ascending: false })
    .order('created_at')
    .limit(50);
  if (error) return serverError(error, 'public');
  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' },
  });
}
