import { GA_ID } from './gtag';

/** The six user journeys across the site. */
export type Journey = 'orientation' | 'culture' | 'language' | 'history' | 'dictionary' | 'proverbs' | 'contact' | 'sharing';

export type TrackParams = Record<string, string | number | boolean>;

/**
 * Send a GA4 custom event.
 *
 * Event name format: `{journey}_{stage}_{action}` (snake_case, max 40 chars).
 * In development the event is logged to the console instead of being sent.
 */
export function track(
  journey: Journey,
  stage: string,
  action: string,
  params?: TrackParams,
): void {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return;

  const eventName = `${journey}_${stage}_${action}`.slice(0, 40);

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Analytics] ${eventName}`, params || {});
    return;
  }

  window.gtag('event', eventName, {
    journey,
    stage,
    action,
    ...params,
  });
}

/** Track a navigation click that isn't journey-specific. */
export function trackNavClick(source: string, destination: string): void {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return;

  const eventName = 'navigation_click';

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Analytics] ${eventName}`, { source, destination });
    return;
  }

  window.gtag('event', eventName, { source, destination });
}

/** Track a share action (image share, link copy, fallback). */
export function trackShare(contentType: string, result: string): void {
  track('sharing' as Journey, 'action', result, { content_type: contentType });
}

/** Track when the user switches between locales. */
export function trackLocaleSwitch(fromLocale: string, toLocale: string, source: string): void {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return;

  const eventName = 'locale_switch';

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Analytics] ${eventName}`, { from_locale: fromLocale, to_locale: toLocale, source });
    return;
  }

  window.gtag('event', eventName, { from_locale: fromLocale, to_locale: toLocale, source });
}
