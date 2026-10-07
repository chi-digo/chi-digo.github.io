'use client';

import { useState } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import { hasConsent, grantConsent, TELEMETRY_CONSENT_ENABLED } from '@/lib/analytics/gtag';
import styles from './ConsentBanner.module.css';

export function ConsentBanner() {
  const hydrated = useHydrated();
  const [answered, setAnswered] = useState(false);

  const visible =
    hydrated &&
    TELEMETRY_CONSENT_ENABLED &&
    !answered &&
    !hasConsent() &&
    localStorage.getItem('chidigo-consent') !== 'denied';

  if (!visible) return null;

  const handleAccept = () => {
    grantConsent();
    setAnswered(true);
  };

  const handleDecline = () => {
    localStorage.setItem('chidigo-consent', 'denied');
    setAnswered(true);
  };

  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        We use cookies and session recordings to understand how visitors interact with this site and improve the experience.
      </p>
      <div className={styles.buttons}>
        <button type="button" className={styles.decline} onClick={handleDecline}>
          Decline
        </button>
        <button type="button" className={styles.accept} onClick={handleAccept}>
          Accept
        </button>
      </div>
    </div>
  );
}
