"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { TextField, TextAreaField } from "@/components/Field";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { DevOtpBanner } from "@/components/DevOtpBanner";
import { Logo } from "@/components/Logo";

type Step = "loading" | "unavailable" | "email" | "otp" | "name" | "compose" | "sent";

export default function MessageComposePage() {
  const { username } = useParams<{ username: string }>();
  const [step, setStep] = useState<Step>("loading");
  const [receiverName, setReceiverName] = useState("");
  const [unavailableReason, setUnavailableReason] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [profileRes, meRes] = await Promise.all([
        fetch(`/api/v1/public/${username}`),
        fetch("/api/v1/me"),
      ]);
      if (!profileRes.ok) {
        setUnavailableReason("This contact URL doesn't exist.");
        setStep("unavailable");
        return;
      }
      const profile = await profileRes.json();
      setReceiverName(profile.name);
      if (!profile.can_receive_messages) {
        setUnavailableReason(`${profile.name.split(" ")[0]} isn't currently accepting messages.`);
        setStep("unavailable");
        return;
      }
      const me = await meRes.json();
      if (me.user) {
        setLoggedIn(true);
        setName(me.user.name);
        setStep("compose");
      } else {
        setStep("email");
      }
    })();
  }, [username]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "message_verification" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Couldn't send a code.");
        return;
      }
      setCode("");
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  async function verify(fullCode: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode, purpose: "message_verification" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "That code isn't right.");
        setCode("");
        return;
      }
      setStep("name");
    } finally {
      setLoading(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/public/${username}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loggedIn ? { body } : { body, email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Couldn't send your message. Try again.");
        return;
      }
      setConversationId(data.conversationId);
      setStep("sent");
    } finally {
      setLoading(false);
    }
  }

  if (step === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <Logo />
      </main>
    );
  }

  if (step === "unavailable") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="text-center">
          <Logo className="justify-center" />
          <p className="mt-8 font-display text-xl text-ink">{unavailableReason}</p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-seal hover:text-seal-dark">
            Go to PingLink
          </Link>
        </div>
      </main>
    );
  }

  if (step === "email") {
    return (
      <AuthCard title={`Message ${receiverName}`} subtitle="First, verify your email.">
        <form onSubmit={requestCode} className="space-y-4">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />
          {error && <p className="text-sm text-wax">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send verification code"}
          </Button>
        </form>
      </AuthCard>
    );
  }

  if (step === "otp") {
    return (
      <AuthCard title="Enter verification code" subtitle={`We've sent a code to ${email}`}>
        <DevOtpBanner email={email} purpose="message_verification" />
        <OtpInput value={code} onChange={setCode} onComplete={verify} error={error} />
        <button
          onClick={() => requestCode()}
          disabled={loading}
          className="mt-4 text-sm font-medium text-seal hover:text-seal-dark"
        >
          Didn't receive it? Resend
        </button>
      </AuthCard>
    );
  }

  if (step === "name") {
    return (
      <AuthCard title="What's your name?" subtitle={`${receiverName} will see this.`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return setError("Enter your name.");
            setStep("compose");
          }}
          className="space-y-4"
        >
          <TextField label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" />
          {error && <p className="text-sm text-wax">{error}</p>}
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </AuthCard>
    );
  }

  if (step === "sent") {
    return (
      <AuthCard title="Message sent" subtitle={`${receiverName} has received your message.`}>
        <p className="text-sm text-slate">You'll be notified if {receiverName.split(" ")[0]} replies.</p>
        <Link
          href={conversationId ? `/conversations/${conversationId}` : "/dashboard"}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-seal px-5 py-2.5 text-[0.95rem] font-medium text-white hover:bg-seal-dark"
        >
          View conversation
        </Link>
      </AuthCard>
    );
  }

  // compose
  return (
    <AuthCard title={`Message ${receiverName}`} subtitle={`From: ${name}`}>
      <form onSubmit={send} className="space-y-4">
        <TextAreaField
          label="Message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder={`Hi ${receiverName.split(" ")[0]}, ...`}
          required
        />
        <p className="text-xs text-slate">{receiverName.split(" ")[0]} won't see your email address.</p>
        {error && <p className="text-sm text-wax">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send message"}
        </Button>
      </form>
    </AuthCard>
  );
}
