'use client';

import { useState, useEffect } from 'react';
import { hasConsent, grantConsent, GA_ID } from '@/lib/analytics/gtag';
import styles from './ConsentBanner.module.css';

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    if (!hasConsent() && localStorage.getItem('chidigo-consent') !== 'denied') {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    grantConsent();
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('chidigo-consent', 'denied');
    setVisible(false);
  };

  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        We use cookies to understand how visitors use this site and improve the experience.
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
