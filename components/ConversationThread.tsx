"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = { id: string; body: string; createdAt: string; fromMe: boolean };
type Other = { id: string; name: string; username: string | null };

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "scam", label: "Scam/fraud" },
  { value: "threat", label: "Threat" },
  { value: "other", label: "Other" },
];

export function ConversationThread({
  conversationId,
  initialOther,
  initialMessages,
}: {
  conversationId: string;
  initialOther: Other | null;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/v1/conversations/${conversationId}/read`, { method: "POST" });
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/v1/conversations/${conversationId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    }, 4000);
    return () => clearInterval(interval);
  }, [conversationId]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const data = await res.json();
      if (!res.ok) {
        // PRD section 69 — never confirm a block explicitly to the sender.
        setError(data.message || "Message couldn't be sent.");
        return;
      }
      setMessages((m) => [...m, { id: data.message.id, body: data.message.body, createdAt: data.message.createdAt, fromMe: true }]);
      setReply("");
    } finally {
      setSending(false);
    }
  }

  async function block() {
    if (!initialOther) return;
    await fetch(`/api/v1/users/${initialOther.id}/block`, { method: "POST" });
    setBlocked(true);
    setMenuOpen(false);
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/v1/conversations/${conversationId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason, description: reportDetails || undefined }),
    });
    setReportSent(true);
  }

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <button onClick={() => router.push("/dashboard")} className="text-sm font-medium text-slate hover:text-ink">
          ← Inbox
        </button>
        <p className="font-display text-ink">{initialOther?.name ?? "Conversation"}</p>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Conversation options"
            className="rounded-full px-2 py-1 text-slate hover:bg-paper hover:text-ink"
          >
            •••
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-line bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setReportOpen(true);
                  setMenuOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-paper"
              >
                Report
              </button>
              <button onClick={block} className="block w-full px-4 py-2 text-left text-sm text-wax hover:bg-wax-light">
                Block {initialOther?.name.split(" ")[0]}
              </button>
            </div>
          )}
        </div>
      </div>

      {blocked && (
        <div className="border-b border-line bg-wax-light px-6 py-2.5 text-sm text-wax">
          You've blocked {initialOther?.name}. They won't be able to send new messages.
        </div>
      )}

      {reportOpen && (
        <div className="border-b border-line bg-paper px-6 py-5">
          {!reportSent ? (
            <form onSubmit={submitReport} className="space-y-3">
              <p className="text-sm font-medium text-ink">Why are you reporting this?</p>
              <div className="flex flex-wrap gap-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
                      reportReason === r.value ? "border-seal bg-seal-light text-seal-dark" : "border-line text-slate"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reportReason === r.value}
                      onChange={() => setReportReason(r.value)}
                      className="sr-only"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Additional details (optional)"
                rows={2}
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-seal focus:ring-1 focus:ring-seal"
              />
              <div className="flex gap-3">
                <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
                  Submit report
                </button>
                <button type="button" onClick={() => setReportOpen(false)} className="text-sm text-slate">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-seal-dark">Report submitted. Thanks for flagging this.</p>
          )}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[0.95rem] ${
                m.fromMe ? "bg-seal text-white" : "border border-line bg-white text-ink"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendReply} className="border-t border-line px-6 py-4">
        {error && <p className="mb-2 text-sm text-wax">{error}</p>}
        <div className="flex items-end gap-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendReply(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Write a reply…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-lg border border-line px-3.5 py-2.5 text-[0.95rem] outline-none focus:border-seal focus:ring-1 focus:ring-seal"
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="rounded-full bg-seal px-5 py-2.5 text-sm font-medium text-white hover:bg-seal-dark disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
