import { cookies } from "next/headers";
import { hashSessionToken } from "./otp";
import { getSessionByTokenHash } from "./repo";
import { getUserById, type User } from "./repo";

export const SESSION_COOKIE = "pinglink_session";

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = getSessionByTokenHash(hashSessionToken(token));
  if (!session) return null;
  const user = getUserById(session.user_id);
  return user ?? null;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
