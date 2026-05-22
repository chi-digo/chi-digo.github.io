'use client';

import { use } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { QuizRoundDetail } from '@/components/QuizRoundDetail/QuizRoundDetail';

export default function QuizRoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
        <QuizRoundDetail roundId={id} />
      </main>
    </AuthGuard>
  );
}
