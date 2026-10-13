import { describe, expect, it } from 'vitest';
import { isPrivatePath } from '@/lib/pwa/private-paths';

describe('service worker never caches private pages', () => {
  it.each(['/review', '/review/abc', '/sw/review', '/dg/admin/reviewers', '/profile', '/profile/contributions', '/sw/profile', '/api/overlay/plant'])(
    '%s is private',
    (p) => expect(isPrivatePath(p)).toBe(true),
  );
  it.each(['/', '/sw', '/culture/ecology/plants', '/reviews-of-plants', '/profiles', '/language/dictionary'])('%s is cacheable', (p) =>
    expect(isPrivatePath(p)).toBe(false),
  );
});
