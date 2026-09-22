"use client";

import { useRef } from "react";

export function OtpInput({
  value,
  onChange,
  onComplete,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  error?: string | null;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join("").replace(/\s/g, "");
    onChange(joined);
    if (char && index < 5) refs.current[index + 1]?.focus();
    if (joined.length === 6) onComplete?.(joined);
  }

  return (
    <div>
      <div className="flex gap-2" role="group" aria-label="Verification code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={d.trim()}
            onChange={(e) => {
              const char = e.target.value.replace(/\D/g, "").slice(-1);
              setDigit(i, char);
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i].trim() && i > 0) {
                refs.current[i - 1]?.focus();
              }
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
              if (text.length > 1) {
                e.preventDefault();
                onChange(text);
                if (text.length === 6) onComplete?.(text);
                refs.current[Math.min(text.length, 5)]?.focus();
              }
            }}
            className={`h-12 w-10 rounded-lg border text-center text-lg font-medium text-ink outline-none focus:border-seal focus:ring-1 focus:ring-seal ${
              error ? "border-wax" : "border-line"
            }`}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-wax">{error}</p>}
    </div>
  );
}
