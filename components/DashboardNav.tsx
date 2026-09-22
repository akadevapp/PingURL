"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";

export function DashboardNav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Inbox" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium ${
                pathname === l.href ? "text-ink" : "text-slate hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <span className="hidden text-sm text-slate sm:inline">{name}</span>
          <button
            onClick={async () => {
              await fetch("/api/v1/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
            className="text-sm font-medium text-slate hover:text-wax"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
