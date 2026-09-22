import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isParticipant, getConversationWithParticipants, getMessages, markRead } from "@/lib/repo";
import { DashboardNav } from "@/components/DashboardNav";
import { ConversationThread } from "@/components/ConversationThread";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  // Re-verify participation server-side too — never trust the URL alone.
  if (!isParticipant(id, user.id)) notFound();

  const data = getConversationWithParticipants(id);
  if (!data) notFound();

  const other = data.participants.find((p) => p.user_id !== user.id) ?? null;
  const messages = getMessages(id).map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.created_at,
    fromMe: m.sender_user_id === user.id,
  }));
  markRead(id, user.id);

  return (
    <div className="min-h-screen bg-white">
      <DashboardNav name={user.name} />
      <ConversationThread
        conversationId={id}
        initialOther={other ? { id: other.user_id, name: other.name, username: other.username } : null}
        initialMessages={messages}
      />
    </div>
  );
}
