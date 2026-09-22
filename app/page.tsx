import Link from "next/link";
import { Logo, SealMark } from "@/components/Logo";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link href="/login" className="text-sm font-medium text-slate hover:text-ink">
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <h1 className="font-display text-4xl leading-[1.1] text-balance md:text-5xl">
              Get messages without giving out your phone number.
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Publish a personal URL. Anyone can message you privately from it — no app to
              install, no number to hand over.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-seal px-6 py-3 text-[0.95rem] font-medium text-white transition-colors hover:bg-seal-dark"
              >
                Create my URL
              </Link>
              <span className="text-sm text-white/50">No phone number required.</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rotate-[-2deg] rounded-2xl border border-white/10 bg-paper p-6 text-ink shadow-2xl">
              <div className="flex items-center gap-3">
                <SealMark size={40} />
                <div>
                  <p className="font-display text-lg leading-tight">John Smith</p>
                  <p className="text-sm text-slate">Freelance Product Designer</p>
                </div>
              </div>
              <div className="mt-5 rounded-lg border border-line bg-white px-4 py-3 text-sm text-slate">
                pinglink.com/johnsmith
              </div>
              <div className="mt-4 rounded-full bg-seal px-4 py-2.5 text-center text-sm font-medium text-white">
                Send a message
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 rotate-[4deg] rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-lg">
              <span className="font-medium">Sarah:</span> is the apartment still available?
            </div>
          </div>
        </div>
      </section>

      {/* Three steps a genuine sequence, so numbering earns its place */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-3">
          <Step
            n={1}
            title="Your URL"
            body="Verify your email, pick a username, and pinglink.com/you is ready to share."
          />
          <Step
            n={2}
            title="Your inbox"
            body="Put it in your bio, listing, or signature. Messages land in one place, with an email nudge so you never miss one."
          />
          <Step
            n={3}
            title="Your conversation"
            body="Reply from your inbox. Your phone number and email stay off the record the whole time."
          />
        </div>
      </section>

      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl text-ink">Private from other users. Not anonymous.</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate">
            PingLink knows who is who, the same way any account-based product does, and that is
            what makes blocking, reporting, and account recovery possible. What it never does is
            hand your email or phone number to the person on the other end of the conversation.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[0.95rem] font-medium text-white transition-colors hover:bg-ink/90"
          >
            Create my URL
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-10 text-sm text-slate">
        <Logo className="text-sm" />
        <p>&copy; {new Date().getFullYear()} PingLink</p>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line font-display text-sm text-ink">
        {n}
      </div>
      <h3 className="mt-4 font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-slate">{body}</p>
    </div>
  );
}
