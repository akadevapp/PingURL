import type { Metadata } from "next";
import Link from "next/link";
import { getContactLinkByUsername } from "@/lib/repo";
import { normalizeUsername } from "@/lib/validation";
import { Logo } from "@/components/Logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const link = getContactLinkByUsername(normalizeUsername(username));
  return {
    title: link ? `${link.user.name} — PingLink` : "PingLink",
    robots: { index: false, follow: false }, // opt-in only (PRD section 64)
  };
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const link = getContactLinkByUsername(normalizeUsername(username));

  if (!link || !link.is_active || link.user.status !== "active") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="text-center">
          <Logo className="justify-center" />
          <p className="mt-8 font-display text-xl text-ink">This contact URL doesn't exist.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-seal hover:text-seal-dark">
            Go to PingLink
          </Link>
        </div>
      </main>
    );
  }

  const { user } = link;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-seal-light font-display text-xl text-seal-dark">
          {initials(user.name)}
        </div>
        <h1 className="mt-4 font-display text-xl text-ink">{user.name}</h1>
        {user.bio && <p className="mt-1.5 text-sm text-slate">{user.bio}</p>}

        <div className="mt-6 border-t border-line pt-6">
          {user.accepting_messages ? (
            <>
              <p className="text-[0.95rem] text-ink">Send {user.name.split(" ")[0]} a private message.</p>
              <p className="mt-1 text-sm text-slate">Your phone number won't be shared.</p>
              <Link
                href={`/${user.username}/message`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-seal px-5 py-2.5 text-[0.95rem] font-medium text-white hover:bg-seal-dark"
              >
                Send a message
              </Link>
              <p className="mt-4 text-xs text-slate">No account? That's okay. You'll verify your email.</p>
            </>
          ) : (
            <p className="text-[0.95rem] text-slate">{user.name.split(" ")[0]} isn't currently accepting messages.</p>
          )}
        </div>
      </div>
    </main>
  );
}
