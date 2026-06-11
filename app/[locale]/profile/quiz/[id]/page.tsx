'use client';

import { use } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { QuizRoundDetail } from '@/components/QuizRoundDetail/QuizRoundDetail';

export default function QuizRoundPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <main style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-hando-cream)',
        color: 'var(--color-kaya-deep)',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'calc(var(--nav-height) + var(--breadcrumb-height, 28px) + var(--space-6)) 5.25% var(--space-6)',
        }}>
          <QuizRoundDetail roundId={id} />
        </div>
      </main>
    </AuthGuard>
  );
}
