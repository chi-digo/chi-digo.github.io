'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';
import { hasConsent } from '@/lib/analytics/gtag';

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || '';

function isSlowConnection(): boolean {
  const conn = (navigator as any).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  return ['2g', 'slow-2g', '3g'].includes(conn.effectiveType);
}

export function ClarityProvider() {
  const [consentGranted, setConsentGranted] = useState(hasConsent);

  useEffect(() => {
    const handler = () => setConsentGranted(true);
    window.addEventListener('consent-granted', handler);
    return () => window.removeEventListener('consent-granted', handler);
  }, []);

  if (!CLARITY_ID || process.env.NODE_ENV !== 'production') return null;
  if (!consentGranted) return null;
  if (isSlowConnection()) return null;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","${CLARITY_ID}");
        `,
      }}
    />
  );
}
