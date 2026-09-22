"use client";

import { CopyButton } from "./CopyButton";
import { Button } from "./Button";

export function ContactUrlCard({ url }: { url: string }) {
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="rounded-xl border border-line bg-paper px-5 py-4">
      <p className="text-sm text-slate">Your contact URL</p>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg text-ink">{url.replace(/^https?:\/\//, "")}</p>
        <div className="flex gap-2">
          <CopyButton text={url} />
          {canShare && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigator.share({ title: "My PingLink", url }).catch(() => {})}
            >
              Share
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
