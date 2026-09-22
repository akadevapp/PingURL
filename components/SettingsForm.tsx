"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, TextAreaField } from "./Field";
import { Button } from "./Button";

type Props = {
  initialName: string;
  initialBio: string;
  initialAcceptingMessages: boolean;
  username: string | null;
};

export function SettingsForm({ initialName, initialBio, initialAcceptingMessages, username }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [acceptingMessages, setAcceptingMessages] = useState(initialAcceptingMessages);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, acceptingMessages }),
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await fetch("/api/v1/me", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={save} className="space-y-4">
        <h2 className="font-display text-lg text-ink">Profile</h2>
        {username && (
          <p className="text-sm text-slate">
            Your URL: <span className="text-ink">pinglink.com/{username}</span>
          </p>
        )}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextAreaField
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="Freelance product designer"
        />

        <div className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Accepting new messages</p>
            <p className="text-sm text-slate">Turn off to pause your contact URL without deleting it.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={acceptingMessages}
            onClick={() => setAcceptingMessages((v) => !v)}
            className={`h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
              acceptingMessages ? "bg-seal" : "bg-line"
            }`}
          >
            <span
              className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                acceptingMessages ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved && <span className="text-sm text-seal">Saved</span>}
        </div>
      </form>

      <div className="border-t border-line pt-8">
        <h2 className="font-display text-lg text-ink">Account</h2>
        <p className="mt-1 text-sm text-slate">
          Deleting your account disables your URL and removes your profile. This can't be undone.
        </p>
        {!confirmingDelete ? (
          <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirmingDelete(true)}>
            Delete my account
          </Button>
        ) : (
          <div className="mt-4 rounded-lg border border-wax/30 bg-wax-light px-4 py-3.5">
            <p className="text-sm text-ink">Delete your account? This can't be undone.</p>
            <div className="mt-3 flex gap-3">
              <Button type="button" variant="danger" onClick={deleteAccount} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, delete"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
