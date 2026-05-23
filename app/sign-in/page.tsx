'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';
import styles from './sign-in.module.css';

function VigangoMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={styles.mark}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <circle cx="16" cy="9" r="4" />
        <rect x="13" y="15" width="6" height="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <polygon points="13,15 19,15 16,22" />
        <polygon points="13,29 19,29 16,22" />
      </g>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function SignInContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const returnTo = searchParams.get('returnTo') || '/';
  const error = searchParams.get('error');

  useEffect(() => {
    if (!loading && user) {
      router.replace(returnTo);
    }
  }, [loading, user, router, returnTo]);

  const handleGoogleSignIn = async () => {
    track('orientation', 'auth', 'sign_in_start', { method: 'google' });
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  if (loading || user) {
    return null;
  }

  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.brandContent}>
          <VigangoMark />
          <span className={styles.brandName}>Chidigo</span>
          <p className={styles.tagline}>{t.auth.sign_in_tagline}</p>
        </div>
        <svg className={styles.kangaPattern} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="kanga" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <rect x="22" y="2" width="4" height="4" rx="1" />
              <rect x="2" y="22" width="4" height="4" rx="1" />
              <rect x="42" y="22" width="4" height="4" rx="1" />
              <rect x="22" y="42" width="4" height="4" rx="1" />
              <path d="M12 12l4 4M32 12l-4 4M12 36l4-4M32 36l-4 4" strokeWidth="1" stroke="currentColor" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kanga)" />
        </svg>
      </div>

      <div className={styles.formZone}>
        <div className={styles.formContent}>
          <h1 className={styles.title}>{t.auth.sign_in}</h1>

          <ul className={styles.benefits}>
            <li className={styles.benefit}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {t.auth.benefit_favourites}
            </li>
            <li className={styles.benefit}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              {t.auth.benefit_quiz}
            </li>
            <li className={styles.benefit}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
              </svg>
              {t.auth.benefit_sync}
            </li>
          </ul>

          {error && (
            <p className={styles.error} role="alert">{t.auth.error_generic}</p>
          )}

          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            {t.auth.google_sign_in}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
