"use client";

import { useEffect, useRef, useState } from "react";
import { TextField } from "./Field";
import { Button } from "./Button";

export function UsernameClaim({ onClaimed }: { onClaimed: (username: string) => void }) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAvailable(null);
    setCheckError(null);
    if (!value.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(`/api/v1/usernames/${encodeURIComponent(value.trim())}/availability`);
        const data = await res.json();
        if (data.error) setCheckError(data.error);
        else setAvailable(data.available);
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/v1/me/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || "That URL didn't work. Try another.");
        return;
      }
      onClaimed(data.username);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = value.trim().length >= 3 && available === true && !submitting;

  return (
    <div>
      <TextField
        label="Choose your URL"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="johnsmith"
        error={checkError || submitError}
        hint="3–30 characters: lowercase letters, numbers and hyphens."
      />
      <div className="mt-2 flex items-center justify-between text-sm">
        <p className="text-slate">
          pinglink.com/<span className="text-ink">{value.trim() || "yourname"}</span>
        </p>
        {value.trim().length >= 3 && (
          <p className={available ? "text-seal" : checking ? "text-slate" : "text-wax"}>
            {checking ? "Checking…" : available ? "Available" : available === false ? "Taken" : ""}
          </p>
        )}
      </div>
      <Button type="button" onClick={submit} disabled={!canSubmit} className="mt-5 w-full">
        {submitting ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
}
