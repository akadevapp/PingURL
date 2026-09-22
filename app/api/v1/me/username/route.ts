import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { usernameError, normalizeUsername } from "@/lib/validation";
import { getUserByUsername, setUsername } from "@/lib/repo";
import { z } from "zod";

const schema = z.object({ username: z.string().min(1).max(30) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const normalized = normalizeUsername(parsed.data.username);
  const error = usernameError(normalized);
  if (error) return NextResponse.json({ error: "invalid_username", message: error }, { status: 400 });

  const existing = getUserByUsername(normalized);
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: "taken", message: "That URL is already taken." }, { status: 409 });
  }

  setUsername(user.id, normalized);
  return NextResponse.json({ ok: true, username: normalized });
}
