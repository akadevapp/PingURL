"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { TextField } from "@/components/Field";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { DevOtpBanner } from "@/components/DevOtpBanner";
import { UsernameClaim } from "@/components/UsernameClaim";

type Step = "details" | "otp" | "username";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter your name.");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Couldn't send a code. Check your email address.");
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
        body: JSON.stringify({ email, code: fullCode, purpose: "signup", name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "That code isn't right.");
        setCode("");
        return;
      }
      setStep("username");
    } finally {
      setLoading(false);
    }
  }

  if (step === "details") {
    return (
      <AuthCard title="Create your contact URL" subtitle="We'll send you a code — no password needed.">
        <form onSubmit={requestCode} className="space-y-4">
          <TextField label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@email.com"
            required
          />
          {error && <p className="text-sm text-wax">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Continue"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-slate">
          Already have a URL?{" "}
          <a href="/login" className="font-medium text-seal hover:text-seal-dark">
            Log in
          </a>
        </p>
      </AuthCard>
    );
  }

  if (step === "otp") {
    return (
      <AuthCard title="Enter verification code" subtitle={`We've sent a code to ${email}`}>
        <DevOtpBanner email={email} purpose="signup" />
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

  return (
    <AuthCard title="Choose your URL" subtitle="This is what you'll share instead of your phone number.">
      <UsernameClaim
        onClaimed={() => {
          router.push("/dashboard");
          router.refresh();
        }}
      />
    </AuthCard>
  );
}
