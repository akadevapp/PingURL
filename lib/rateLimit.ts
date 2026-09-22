/**
 * In-memory rate limiting. Fine for a single dev process; the PRD (section
 * 49) correctly calls for Redis in production so limits hold across
 * multiple server instances — swap `hits` for an Upstash/Redis sorted-set
 * implementation when you deploy for real.
 */

const globalForRl = globalThis as unknown as { __pinglinkHits?: Map<string, number[]> };
const hits = globalForRl.__pinglinkHits ?? new Map<string, number[]>();
globalForRl.__pinglinkHits = hits;

export function checkRateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterMs?: number } {
  const nowTs = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => nowTs - t < windowMs);
  if (arr.length >= max) {
    const retryAfterMs = windowMs - (nowTs - arr[0]);
    hits.set(key, arr);
    return { ok: false, retryAfterMs };
  }
  arr.push(nowTs);
  hits.set(key, arr);
  return { ok: true };
}

// PRD section 49 starting values.
export const LIMITS = {
  otpRequestsPerEmail: { max: 3, windowMs: 15 * 60_000 },
  newConversationsPerAccount: { max: 10, windowMs: 60 * 60_000 },
  messagesPerAccount: { max: 30, windowMs: 60 * 60_000 },
  publicProfileViewsPerIp: { max: 120, windowMs: 60 * 60_000 },
};

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
