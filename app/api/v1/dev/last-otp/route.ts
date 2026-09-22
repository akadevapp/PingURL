import { NextResponse } from "next/server";
import { getDevOtp, mailerIsDevMode } from "@/lib/mailer";

export async function GET(req: Request) {
  if (!mailerIsDevMode) return NextResponse.json({ code: null }, { status: 404 });
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const purpose = url.searchParams.get("purpose");
  if (!email || !purpose) return NextResponse.json({ code: null }, { status: 400 });
  const code = getDevOtp(email, purpose);
  return NextResponse.json({ code: code ?? null });
}
