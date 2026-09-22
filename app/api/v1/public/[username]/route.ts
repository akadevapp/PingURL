import { NextResponse } from "next/server";
import { getContactLinkByUsername } from "@/lib/repo";
import { normalizeUsername } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const link = getContactLinkByUsername(normalizeUsername(username));
  if (!link || !link.is_active || link.user.status !== "active") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    username: link.user.username,
    name: link.user.name,
    bio: link.user.bio,
    can_receive_messages: !!link.user.accepting_messages,
  });
}
