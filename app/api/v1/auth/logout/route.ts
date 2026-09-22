import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashSessionToken } from "@/lib/otp";
import { deleteSessionByTokenHash } from "@/lib/repo";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSessionByTokenHash(hashSessionToken(token));
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
