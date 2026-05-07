// Core GA4 gtag.js analytics module — zero npm dependencies.
// Uses Consent Mode v2: analytics default to denied until user accepts.

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

/** Bootstrap Consent Mode with analytics_storage denied by default. */
export function initConsent(): void {
  if (typeof window === 'undefined' || !GA_ID) return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

/** Flip consent to granted and persist the decision. */
export function grantConsent(): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  localStorage.setItem('chidigo-consent', 'granted');
}

/** True when user previously accepted analytics. */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('chidigo-consent') === 'granted';
}

/** Set GA4 user-scoped properties (no PII). */
export function setUserProperties(props: Record<string, string>): void {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return;
  window.gtag('set', 'user_properties', props);
}
