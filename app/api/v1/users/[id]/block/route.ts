import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createBlock, removeBlock } from "@/lib/repo";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (id === user.id) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  createBlock(user.id, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  removeBlock(user.id, id);
  return NextResponse.json({ ok: true });
}
