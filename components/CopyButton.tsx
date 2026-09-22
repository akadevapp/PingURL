"use client";

import { useState } from "react";
import { Button } from "./Button";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard API can be unavailable (e.g. insecure context); the
          // link is still selectable/visible, so this fails quietly.
        }
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
