import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, setSessionCookie } from "@/lib/auth";
import { normalizeUsername, emailSchema, messageBodySchema } from "@/lib/validation";
import {
  getContactLinkByUsername,
  getUserByEmail,
  createUser,
  markEmailVerified,
  wasEmailRecentlyVerified,
  isBlocked,
  findConversationBetween,
  createConversation,
  addMessage,
  createSession,
} from "@/lib/repo";
import { generateSessionToken, hashSessionToken } from "@/lib/otp";
import { sendNewMessageEmail } from "@/lib/mailer";
import { checkRateLimit, LIMITS } from "@/lib/rateLimit";

const schema = z.object({
  body: messageBodySchema,
  email: emailSchema.optional(),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const link = getContactLinkByUsername(normalizeUsername(username));
  if (!link || !link.is_active || link.user.status !== "active") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!link.user.accepting_messages) {
    return NextResponse.json(
      { error: "not_accepting", message: "This person isn't currently accepting messages." },
      { status: 403 }
    );
  }

  // Resolve the sender: an existing session wins (PRD 66 — no
  // re-verification once you have a valid session). Otherwise this must be
  // an email that was JUST verified via OTP (PRD 13).
  let sender = await getCurrentUser();
  let freshSession = false;

  if (!sender) {
    if (!parsed.data.email || !parsed.data.name) {
      return NextResponse.json({ error: "verification_required" }, { status: 401 });
    }
    if (!wasEmailRecentlyVerified(parsed.data.email, "message_verification")) {
      return NextResponse.json({ error: "verification_required" }, { status: 401 });
    }
    sender = getUserByEmail(parsed.data.email) ?? null;
    if (!sender) {
      sender = createUser({ email: parsed.data.email, name: parsed.data.name, emailVerified: true });
    } else if (!sender.email_verified_at) {
      markEmailVerified(sender.id);
    }
    freshSession = true;
  }

  if (sender.id === link.user.id) {
    return NextResponse.json({ error: "cannot_message_self" }, { status: 400 });
  }

  // Never reveal a block to the blocked party (PRD section 18, 69).
  if (isBlocked(link.user.id, sender.id)) {
    return NextResponse.json(
      { error: "cannot_send", message: "This message couldn't be sent." },
      { status: 403 }
    );
  }

  const conversationLimit = checkRateLimit(
    `newconvo:${sender.id}`,
    LIMITS.newConversationsPerAccount.max,
    LIMITS.newConversationsPerAccount.windowMs
  );
  const messageLimit = checkRateLimit(
    `message:${sender.id}`,
    LIMITS.messagesPerAccount.max,
    LIMITS.messagesPerAccount.windowMs
  );
  if (!messageLimit.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "You've reached the messaging limit. Please try again later." },
      { status: 429 }
    );
  }

  let conversation = findConversationBetween(link.id, sender.id);
  if (!conversation) {
    if (!conversationLimit.ok) {
      return NextResponse.json(
        { error: "rate_limited", message: "You've reached the messaging limit. Please try again later." },
        { status: 429 }
      );
    }
    conversation = createConversation(link.id, link.user.id, sender.id);
  }

  const message = addMessage(conversation.id, sender.id, parsed.data.body);

  if (freshSession) {
    const token = generateSessionToken();
    createSession(sender.id, hashSessionToken(token));
    await setSessionCookie(token);
  }

  const origin = new URL(req.url).origin;
  await sendNewMessageEmail(
    link.user.email,
    sender.name,
    parsed.data.body.slice(0, 200),
    `${origin}/conversations/${conversation.id}`
  );

  return NextResponse.json({ ok: true, conversationId: conversation.id, messageId: message.id });
}
