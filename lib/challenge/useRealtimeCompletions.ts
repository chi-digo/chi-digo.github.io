'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CompletionPayload {
  display_name: string;
  score: number;
  total: number;
}

export function useRealtimeCompletions(
  userId: string | null,
  onCompletion: (payload: CompletionPayload) => void,
) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel('my-challenge-completions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'challenge_completions',
        filter: `challenger_id=eq.${userId}`,
      }, (payload) => {
        const row = payload.new as Record<string, unknown>;
        onCompletion({
          display_name: (row.display_name as string) ?? 'Mtu wa Chidigo',
          score: row.score as number,
          total: row.total as number,
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, onCompletion]);
}
