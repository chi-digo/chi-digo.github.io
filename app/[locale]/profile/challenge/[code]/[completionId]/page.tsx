'use client';

import { use } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { ChallengeCompletionDetail } from '@/components/ChallengeCompletionDetail/ChallengeCompletionDetail';

export default function ChallengeCompletionPage({ params }: { params: Promise<{ locale: string; code: string; completionId: string }> }) {
  const { code, completionId } = use(params);

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
          <ChallengeCompletionDetail code={code} completionId={completionId} />
        </div>
      </main>
    </AuthGuard>
  );
}
