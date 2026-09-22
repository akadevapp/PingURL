"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { TextField } from "@/components/Field";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";
import { DevOtpBanner } from "@/components/DevOtpBanner";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setNotFound(false);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "not_found") setNotFound(true);
        else setError(data.message || "Couldn't send a code.");
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
        body: JSON.stringify({ email, code: fullCode, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "That code isn't right.");
        setCode("");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <AuthCard title="Log in" subtitle="No password — we'll email you a code.">
        <form onSubmit={requestCode} className="space-y-4">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />
          {notFound && (
            <p className="text-sm text-wax">
              No account with that email yet.{" "}
              <a href="/signup" className="font-medium underline">
                Create one
              </a>
              .
            </p>
          )}
          {error && <p className="text-sm text-wax">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send code"}
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Enter verification code" subtitle={`We've sent a code to ${email}`}>
      <DevOtpBanner email={email} purpose="login" />
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
