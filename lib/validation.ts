import { z } from "zod";

// PRD section 65, plus every top-level route this app actually serves so a
// username can never shadow a real page.
export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "settings",
  "support",
  "help",
  "about",
  "pricing",
  "terms",
  "privacy",
  "security",
  "dashboard",
  "conversations",
  "message",
  "static",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
  "assets",
  "you",
  "me",
  "null",
  "undefined",
]);

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

const USERNAME_RE = /^[a-z0-9-]{3,30}$/;

export function usernameError(raw: string): string | null {
  const normalized = normalizeUsername(raw);
  if (!USERNAME_RE.test(normalized)) {
    return "Use 3–30 characters: lowercase letters, numbers and hyphens only.";
  }
  if (normalized.startsWith("-") || normalized.endsWith("-") || normalized.includes("--")) {
    return "Hyphens can't be at the start/end or doubled up.";
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return "That URL is reserved. Try something else.";
  }
  return null;
}

export const emailSchema = z.string().trim().email().max(254);

export const requestOtpSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["signup", "login", "message_verification"]),
  name: z.string().trim().min(1).max(80).optional(),
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  purpose: z.enum(["signup", "login", "message_verification"]),
  name: z.string().trim().min(1).max(80).optional(),
});

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Write a message before sending.")
  .max(4000, "Messages are limited to 4,000 characters.");

export const reportReasonSchema = z.enum(["spam", "harassment", "scam", "threat", "other"]);
