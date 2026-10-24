/**
 * Slugs for new proverbs (spec 34 §16.9): `p-NNN-<words>`, ASCII letters and digits only, at most 60
 * characters after the id. Existing slugs are URLs and stay as they are (some contain / or ’).
 */
export function proverbSlug(id: string, digo: string): string {
  const words = digo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’‘]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return words ? `${id}-${words}` : id;
}

/** A new proverb's slug must look like this; checked before any redirect to it. */
export const NEW_PROVERB_SLUG = /^p-\d{3,4}(-[a-z0-9]+)*$/;
/** Any shipped slug (old ones may contain / and ’). */
export const ANY_PROVERB_SLUG = /^p-[a-z0-9’'/-]+$/;
