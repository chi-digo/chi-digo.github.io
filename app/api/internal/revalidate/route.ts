import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';

const ALLOWED = ['overlay', 'overlay:plant', 'overlay:word', 'overlay:proverb', 'credits'] as const;
const bodySchema = z.object({ tags: z.array(z.enum(ALLOWED)).min(1) });

function authorised(header: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !header?.startsWith('Bearer ')) return false;
  const given = Buffer.from(header.slice(7));
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

/** Lets fold-confirm and runbook fixes refresh cached overlay and credits (spec 34 technical §4.1). */
export async function POST(request: Request) {
  if (!authorised(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  for (const tag of body.data.tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: body.data.tags });
}
