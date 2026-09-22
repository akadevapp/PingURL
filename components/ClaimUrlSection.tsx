"use client";

import { UsernameClaim } from "./UsernameClaim";

export function ClaimUrlSection() {
  return (
    <div className="rounded-xl border border-line bg-paper px-5 py-5">
      <p className="font-display text-lg text-ink">Claim your contact URL</p>
      <p className="mt-1 text-sm text-slate">
        You messaged through PingLink but don't have your own URL yet — grab one so people can reach
        you too.
      </p>
      <div className="mt-4">
        <UsernameClaim onClaimed={() => window.location.reload()} />
      </div>
    </div>
  );
}
