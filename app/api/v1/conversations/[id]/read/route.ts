import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isParticipant, markRead } from "@/lib/repo";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isParticipant(id, user.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  markRead(id, user.id);
  return NextResponse.json({ ok: true });
}
