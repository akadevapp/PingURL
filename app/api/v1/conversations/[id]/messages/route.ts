import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { messageBodySchema } from "@/lib/validation";
import {
  isParticipant,
  addMessage,
  getConversationWithParticipants,
  isBlocked,
  getUserById,
} from "@/lib/repo";
import { sendNewMessageEmail } from "@/lib/mailer";
import { checkRateLimit, LIMITS } from "@/lib/rateLimit";

const schema = z.object({ body: messageBodySchema });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isParticipant(id, user.id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const data = getConversationWithParticipants(id);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const other = data.participants.find((p) => p.user_id !== user.id);

  if (other && isBlocked(other.user_id, user.id)) {
    return NextResponse.json({ error: "cannot_send", message: "This message couldn't be sent." }, { status: 403 });
  }

  const limit = checkRateLimit(`message:${user.id}`, LIMITS.messagesPerAccount.max, LIMITS.messagesPerAccount.windowMs);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "You've reached the messaging limit. Please try again later." },
      { status: 429 }
    );
  }

  const message = addMessage(id, user.id, parsed.data.body);

  if (other) {
    const recipient = getUserById(other.user_id);
    if (recipient) {
      const origin = new URL(req.url).origin;
      await sendNewMessageEmail(recipient.email, user.name, parsed.data.body.slice(0, 200), `${origin}/conversations/${id}`);
    }
  }

  return NextResponse.json({ ok: true, message: { id: message.id, body: message.body, createdAt: message.created_at } });
}
