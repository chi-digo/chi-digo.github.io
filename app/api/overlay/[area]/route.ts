import { NextResponse } from 'next/server';
import { getAreaOverlay, OVERLAY_AREAS } from '@/lib/contributions/overlay';
import { serverError } from '@/lib/contributions/server';

/**
 * Accepted changes not yet in the data files, for one area (spec 34 technical §1). The loader merges
 * them over the static JSON. Shared by every visitor and cached briefly at the CDN.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!OVERLAY_AREAS.includes(area)) return NextResponse.json({ error: 'unknown area' }, { status: 404 });
  try {
    const changes = await getAreaOverlay(area);
    return NextResponse.json(
      { changes },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } },
    );
  } catch (err) {
    return serverError(err, 'overlay');
  }
}
