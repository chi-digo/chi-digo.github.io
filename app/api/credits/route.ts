import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';
import { serverError } from '@/lib/contributions/server';

const idsSchema = z.array(z.string().uuid()).min(1).max(200);

export interface Credit {
  id: string;
  credited: boolean;
  first_name: string | null;
  avatar_url: string | null;
  region: string | null;
  recorded_for_name: string | null;
  /** Set when someone recorded this for a speaker: credit reads "<speaker>, recorded by <recorder>". */
  recorder_first_name: string | null;
}

const loadCredits = unstable_cache(
  async (key: string): Promise<Credit[]> => {
    const { data, error } = await createServiceClient()
      .from('contribution_credits')
      .select('id, credited, first_name, avatar_url, region, recorded_for_name, recorder_first_name')
      .in('id', key.split(','));
    if (error) throw new Error(error.message);
    return (data ?? []) as Credit[];
  },
  ['contrib-credits'],
  { tags: ['credits'], revalidate: 300 },
);

/**
 * Credit lines for accepted contributions, resolved when the page renders, so names never live in
 * the data files (spec §10). One request per page for every id on it.
 */
export async function GET(request: Request) {
  const raw = (new URL(request.url).searchParams.get('ids') ?? '').split(',').filter(Boolean);
  const parsed = idsSchema.safeParse([...new Set(raw)].sort());
  if (!parsed.success) return NextResponse.json({ error: 'invalid ids' }, { status: 400 });
  try {
    const credits = await loadCredits(parsed.data.join(','));
    return NextResponse.json(credits, { headers: { 'Cache-Control': 'no-cache', 'CDN-Cache-Control': 'public, s-maxage=60' } });
  } catch (err) {
    return serverError(err, 'credits');
  }
}
