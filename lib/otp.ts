import crypto from "node:crypto";

export function generateOtpCode(): string {
  // 6-digit numeric code, zero-padded, cryptographically random.
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

export function hashOtpCode(code: string): string {
  // Never store the plaintext code (PRD section 7) — only a salted hash.
  return crypto.createHash("sha256").update(`pinglink-otp:${code}`).digest("hex");
}

export function verifyOtpCode(code: string, hash: string): boolean {
  const candidate = hashOtpCode(code);
  const a = Buffer.from(candidate);
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(`pinglink-session:${token}`).digest("hex");
}
