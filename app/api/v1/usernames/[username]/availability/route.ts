import { NextResponse } from "next/server";
import { usernameError, normalizeUsername } from "@/lib/validation";
import { getUserByUsername } from "@/lib/repo";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const error = usernameError(username);
  if (error) {
    return NextResponse.json({ available: false, error });
  }
  const existing = getUserByUsername(normalizeUsername(username));
  return NextResponse.json({ available: !existing, normalized: normalizeUsername(username) });
}
