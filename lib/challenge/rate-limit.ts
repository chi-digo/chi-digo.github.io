const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, limit: number, windowMs = 3600_000): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
