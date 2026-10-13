/**
 * Paths the service worker must never cache (spec 34 technical §7.3): personal and reviewer pages,
 * which change with every decision, and the API, whose shared responses the CDN caches instead.
 */
const PRIVATE = /^(\/(sw|dg))?\/(review|admin|profile)(\/|$)/;

export function isPrivatePath(pathname: string): boolean {
  return pathname.startsWith('/api/') || PRIVATE.test(pathname);
}
