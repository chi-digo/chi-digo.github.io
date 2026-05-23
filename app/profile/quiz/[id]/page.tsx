'use client';

import { use } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { QuizRoundDetail } from '@/components/QuizRoundDetail/QuizRoundDetail';

export default function QuizRoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <main style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-hando-cream)',
        color: 'var(--color-kaya-deep)',
      }}>
        <div style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: 'calc(var(--nav-height) + var(--space-6)) var(--space-4) var(--space-6)',
        }}>
          <QuizRoundDetail roundId={id} />
        </div>
      </main>
    </AuthGuard>
  );
}
