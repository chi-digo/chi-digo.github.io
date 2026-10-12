import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { refreshCredits } from '@/lib/contributions/server';

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  );

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Open suggestions are withdrawn; credit on accepted ones becomes "A Digo speaker" (spec 34 §14).
  await adminClient
    .from('contributions')
    .update({ status: 'withdrawn', claimed_by: null, claimed_until: null })
    .eq('user_id', user.id)
    .in('status', ['pending', 'needs_info']);
  await adminClient.from('contribution_events').insert({
    actor_id: user.id,
    action: 'account_deleted',
    is_test: user.app_metadata?.test === true,
  });
  refreshCredits();

  // End every session on every device. (auth.admin.signOut takes an access token, not a user id,
  // so the caller's own client signs out globally; it also clears the cookies.)
  const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
  if (signOutError) {
    return NextResponse.json({ error: signOutError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
