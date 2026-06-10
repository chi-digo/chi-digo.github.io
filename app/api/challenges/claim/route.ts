import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { resolveChallengerIdentity } from '@/lib/challenge/resolve-identity';

const ANON_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const anonymousId = typeof body.anonymous_id === 'string' && ANON_ID_RE.test(body.anonymous_id)
    ? body.anonymous_id : null;

  if (!anonymousId) {
    return NextResponse.json({ error: 'Invalid anonymous_id' }, { status: 400 });
  }

  const service = createServiceClient();

  const identity = await resolveChallengerIdentity(service, user.id);
  const displayName = identity.display_name ?? 'Mtu wa Chidigo';

  const { data: claimed, error } = await service
    .from('challenge_completions')
    .update({
      user_id: user.id,
      display_name: displayName,
      anonymous_id: null,
    })
    .eq('anonymous_id', anonymousId)
    .is('user_id', null)
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'Failed to claim completions' }, { status: 500 });
  }

  return NextResponse.json({ claimed: claimed?.length ?? 0 });
}
