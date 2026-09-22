import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConversationWithParticipants, getMessages, isParticipant } from "@/lib/repo";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  // Every conversation read must verify the authenticated user actually
  // belongs to it — never trust the id alone (PRD section 48, IDOR).
  if (!isParticipant(id, user.id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = getConversationWithParticipants(id);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const other = data.participants.find((p) => p.user_id !== user.id);
  const messages = getMessages(id).map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.created_at,
    fromMe: m.sender_user_id === user.id,
  }));

  return NextResponse.json({
    conversation: {
      id: data.conversation.id,
      status: data.conversation.status,
      other: other ? { id: other.user_id, name: other.name, username: other.username } : null,
    },
    messages,
  });
}
