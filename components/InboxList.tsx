"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CopyButton } from "./CopyButton";

type Conversation = {
  id: string;
  other_user_name: string;
  last_message_body: string | null;
  last_message_at: string | null;
  unread: boolean;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export function InboxList({ profileUrl }: { profileUrl: string }) {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/v1/conversations");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (!cancelled) setConversations(data.conversations);
    }
    load();
    // Simple polling stands in for real-time for the MVP (PRD section 45) —
    // swap for WebSockets/SSE once that UX actually matters.
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = conversations?.filter((c) => c.unread).length ?? 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Inbox</h2>
        {conversations && conversations.length > 0 && (
          <span className="text-sm text-slate">{unreadCount} unread</span>
        )}
      </div>

      {conversations === null && <p className="text-sm text-slate">Loading…</p>}

      {conversations && conversations.length === 0 && (
        <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-ink">Your inbox is empty.</p>
          <p className="mt-1 text-sm text-slate">Share your contact URL to start receiving messages.</p>
          <div className="mt-4 flex justify-center">
            <CopyButton text={profileUrl} label="Copy my URL" />
          </div>
        </div>
      )}

      {conversations && conversations.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link href={`/conversations/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper">
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${c.unread ? "bg-seal" : "bg-transparent"}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.95rem] font-medium text-ink">{c.other_user_name}</p>
                  <p className="truncate text-sm text-slate">{c.last_message_body}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-slate">{timeAgo(c.last_message_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
