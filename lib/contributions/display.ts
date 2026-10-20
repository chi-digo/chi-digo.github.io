/** Shared display helpers for contributions (product spec §11 lifecycle). */
import type { Status } from './schemas';

/** A one-line summary of what was suggested, from the payload's main field. */
export function payloadSummary(payload: Record<string, unknown> | null | undefined): string {
  if (!payload) return '';
  for (const key of ['name', 'headword', 'digo', 'form', 'proposed', 'text', 'description', 'detail', 'reason']) {
    const v = payload[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

export type StatusChip = 'pending' | 'needs_info' | 'accepted' | 'live' | 'variant' | 'declined' | 'duplicate' | 'withdrawn' | 'reverted' | 'resolved';

/** The status a contributor sees: an accepted change that is live shows as Live (or a regional form). */
export function statusChip(row: { status: Status; live_status?: string | null; outcome?: string | null }): StatusChip {
  if (row.status === 'accepted') {
    if (row.live_status === 'live' || row.live_status === 'reverting') return row.outcome === 'variant' ? 'variant' : 'live';
    return 'accepted';
  }
  return row.status;
}

export const CHIP_VARIANT: Record<StatusChip, 'default' | 'editorial' | 'contributor' | 'success' | 'error'> = {
  pending: 'editorial',
  needs_info: 'contributor',
  accepted: 'success',
  live: 'success',
  variant: 'success',
  declined: 'error',
  duplicate: 'default',
  withdrawn: 'default',
  reverted: 'default',
  resolved: 'success',
};
