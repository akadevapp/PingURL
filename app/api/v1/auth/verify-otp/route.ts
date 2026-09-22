import { NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validation";
import { verifyOtpCode, generateSessionToken, hashSessionToken } from "@/lib/otp";
import {
  getLatestOtp,
  incrementOtpAttempts,
  markOtpUsed,
  getUserByEmail,
  createUser,
  markEmailVerified,
  createSession,
} from "@/lib/repo";
import { setSessionCookie } from "@/lib/auth";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }
  const { email, code, purpose, name } = parsed.data;

  if (purpose === "signup" && !name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const otp = getLatestOtp(email, purpose);
  if (!otp) {
    return NextResponse.json({ error: "no_code", message: "Request a new code." }, { status: 400 });
  }
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "expired", message: "That code expired. Request a new one." }, { status: 400 });
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "too_many_attempts", message: "Too many incorrect attempts. Request a new code." },
      { status: 429 }
    );
  }

  if (!verifyOtpCode(code, otp.code_hash)) {
    incrementOtpAttempts(otp.id);
    return NextResponse.json({ error: "incorrect_code", message: "That code isn't right." }, { status: 400 });
  }

  markOtpUsed(otp.id);

  if (purpose === "message_verification") {
    // Identity is proven, but we don't create an account yet — the caller
    // still needs to collect a display name (PRD section 13). The
    // conversation-creation endpoint re-checks this OTP was just used.
    return NextResponse.json({ ok: true, verified: true });
  }

  let user = getUserByEmail(email);
  if (purpose === "signup") {
    if (!user) {
      user = createUser({ email, name: name!, emailVerified: true });
    } else if (!user.email_verified_at) {
      markEmailVerified(user.id);
    }
  } else if (purpose === "login") {
    if (!user) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  const token = generateSessionToken();
  createSession(user!.id, hashSessionToken(token));
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    user: { id: user!.id, name: user!.name, email: user!.email, username: user!.username },
  });
}
