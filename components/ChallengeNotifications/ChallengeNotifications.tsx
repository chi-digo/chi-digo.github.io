'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRealtimeCompletions } from '@/lib/challenge/useRealtimeCompletions';
import { Toast } from '@chi-digo/design-system';

interface ToastData {
  id: number;
  message: string;
}

let toastId = 0;

export function ChallengeNotifications() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const handleCompletion = useCallback((payload: { display_name: string; score: number; total: number }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, {
      id,
      message: `${payload.display_name} amemala aliko yako — ${payload.score}/${payload.total}!`,
    }]);
  }, []);

  const handleDismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useRealtimeCompletions(user?.id ?? null, handleCompletion);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant="info"
          duration={6000}
          onDismiss={() => handleDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
