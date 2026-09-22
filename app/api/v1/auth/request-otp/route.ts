import { NextResponse } from "next/server";
import { requestOtpSchema } from "@/lib/validation";
import { generateOtpCode, hashOtpCode } from "@/lib/otp";
import { createOtp, getUserByEmail } from "@/lib/repo";
import { sendOtpEmail } from "@/lib/mailer";
import { checkRateLimit, LIMITS, clientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = requestOtpSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }
  const { email, purpose } = parsed.data;

  // PRD section 7: max 3 OTP requests / 15 min, rate-limited by IP + email.
  const ip = clientIp(req.headers);
  const ipCheck = checkRateLimit(`otp:ip:${ip}`, LIMITS.otpRequestsPerEmail.max, LIMITS.otpRequestsPerEmail.windowMs);
  const emailCheck = checkRateLimit(
    `otp:email:${email.toLowerCase()}`,
    LIMITS.otpRequestsPerEmail.max,
    LIMITS.otpRequestsPerEmail.windowMs
  );
  if (!ipCheck.ok || !emailCheck.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many codes requested. Try again in a few minutes." },
      { status: 429 }
    );
  }

  // login must match an existing account; signup/message_verification create one implicitly.
  if (purpose === "login") {
    const existing = getUserByEmail(email);
    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "No account with that email yet — try creating one instead." },
        { status: 404 }
      );
    }
  }

  const code = generateOtpCode();
  createOtp(email, purpose, hashOtpCode(code));
  await sendOtpEmail(email, purpose, code);

  return NextResponse.json({ ok: true });
}
