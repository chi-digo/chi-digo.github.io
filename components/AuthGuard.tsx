'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useLocale } from '@/lib/i18n/context';
import { localePath } from '@/lib/i18n/locale-path';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLocale();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(localePath(`/sign-in?returnTo=${encodeURIComponent(pathname)}`, locale));
    }
  }, [loading, user, router, pathname, locale]);

  if (loading || !user) return null;

  return <>{children}</>;
}
