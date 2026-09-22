"use client";

import { useEffect, useState } from "react";

export function DevOtpBanner({ email, purpose }: { email: string; purpose: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    async function poll() {
      attempts += 1;
      const res = await fetch(`/api/v1/dev/last-otp?email=${encodeURIComponent(email)}&purpose=${purpose}`);
      if (res.status === 404) {
        if (!cancelled) setChecked(true);
        return; // not in dev mode — a real provider is configured
      }
      const data = await res.json();
      if (cancelled) return;
      setChecked(true);
      if (data.code) setCode(data.code);
      else if (attempts < 10) setTimeout(poll, 400);
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [email, purpose]);

  if (!checked || !code) return null;

  return (
    <div className="mb-5 rounded-lg border border-seal/30 bg-seal-light px-3.5 py-2.5 text-sm text-seal-dark">
      <span className="font-medium">Dev mode</span> — no email provider is configured, so here's the
      code we'd have sent: <span className="font-mono font-semibold">{code}</span>
    </div>
  );
}
