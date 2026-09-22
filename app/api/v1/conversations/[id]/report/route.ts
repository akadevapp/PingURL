import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { reportReasonSchema } from "@/lib/validation";
import { isParticipant, createReport } from "@/lib/repo";

const schema = z.object({ reason: reportReasonSchema, description: z.string().trim().max(1000).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isParticipant(id, user.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  createReport({
    reporterUserId: user.id,
    conversationId: id,
    reason: parsed.data.reason,
    description: parsed.data.description,
  });

  return NextResponse.json({ ok: true });
}
