export function SealMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="14" cy="14" r="13" fill="#2F6F6B" />
      <circle cx="14" cy="14" r="13" stroke="#234F4C" strokeWidth="1" />
      <path
        d="M9 15.2c0-3.2 2.3-5.6 5-5.6s5 2.4 5 5.6-2.3 4.6-5 4.6-5-1.4-5-4.6Z"
        fill="#E4EEEC"
        opacity="0.9"
      />
      <circle cx="14" cy="14.4" r="1.6" fill="#2F6F6B" />
    </svg>
  );
}

export function Logo({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-[1.15rem] ${className}`}>
      <SealMark size={22} />
      <span className={dark ? "text-white" : "text-ink"}>PingLink</span>
    </span>
  );
}
