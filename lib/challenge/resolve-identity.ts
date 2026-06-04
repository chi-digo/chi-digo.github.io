import type { SupabaseClient } from '@supabase/supabase-js';

export type ChallengerIdentity = {
  display_name: string | null;
  avatar_url: string | null;
};

export async function resolveChallengerIdentity(
  service: SupabaseClient,
  userId: string,
): Promise<ChallengerIdentity> {
  const { data: profile } = await service
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single();

  if (profile?.display_name) {
    return { display_name: profile.display_name, avatar_url: null };
  }

  const { data: { user } } = await service.auth.admin.getUserById(userId);
  const meta = user?.user_metadata ?? {};

  return {
    display_name: meta.full_name ?? meta.name ?? null,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
  };
}
