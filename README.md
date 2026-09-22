# PingLink

> Get messages without giving out your phone number.

A working prototype of the PRD: every user gets a personal URL
(`pinglink.com/username`). Visitors verify their email and send a private
message — nobody's phone number or email is ever shown to the other party.

This covers PRD Sprints 1–3 (Foundation, Contact URLs, Messaging) plus the
must-have safety basics (block, report, rate limiting). It's a real,
runnable app, not a mockup — see "What's actually implemented" below for
exactly where the line is.

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. That's it — no database to provision, no
API keys to configure, no `.env` file required to try it end to end.

### Trying the full loop locally

Because no email provider is configured out of the box, OTP codes print to
your terminal **and** show up directly in the UI as a "Dev mode" banner on
the verification screen — so you can click through signup → get a URL →
open it in a private/incognito window → message yourself → reply, entirely
in the browser, with no real email account involved.

## What's actually implemented

| Area | Status |
|---|---|
| Email OTP signup/login (hashed codes, 10-min expiry, 5 attempts, rate-limited) | ✅ |
| Username claim with live availability + reserved-word list | ✅ |
| Public profile page (`/username`), noindex by default | ✅ |
| Message compose flow — verifies a new sender's email, or reuses an existing session (PRD §66) | ✅ |
| Inbox for both receivers *and* senders ("sender dashboard", PRD §67), with polling | ✅ |
| Conversation thread with replies | ✅ |
| Block (silent — sender is never told), report, delete/pause account | ✅ |
| Rate limiting (OTP/conversations/messages) at the PRD's starting values | ✅ |
| IDOR protection — every conversation read re-checks participancy server-side | ✅ |
| Settings (name, bio, accepting-messages toggle, delete account) | ✅ |
| Admin console (PRD §53–57) | ❌ not built |
| Real email delivery | ❌ stubbed to console (see below) |
| Multiple contact links per user, custom slugs, analytics | ❌ not built (schema supports it) |
| Notification preferences UI, unsubscribe links | ❌ not built |
| Automated tests | ❌ not written |

## Two deliberate stack substitutions

The PRD recommends **PostgreSQL + Prisma** and Google-hosted fonts via
`next/font`. I built this in a sandboxed environment that blocks Prisma's
engine-binary CDN and Google Fonts, so I substituted zero-network
equivalents I could actually run and test end-to-end, rather than hand you
code I couldn't verify:

- **Data layer**: Node's built-in `node:sqlite` (stable since Node 22, zero
  native deps, zero setup) instead of Postgres. The schema in `lib/db.ts`
  mirrors the PRD's relational design (§20–28) closely enough that this is
  a data-layer swap, not a redesign — see "Moving to production" below.
- **Typography**: system font stacks instead of a fetched webfont. This
  isn't purely a workaround — it means zero webfont-loading latency, which
  fits a product whose whole pitch is "a lightweight utility." Swap in
  `next/font/google` in `app/layout.tsx` any time; nothing else depends on it.

Everything else follows the PRD's recommended stack: Next.js (App Router) +
TypeScript + Tailwind, REST API under `/api/v1`, HTTP-only session cookies,
server-side OTP hashing.

## Project structure

```
app/
  page.tsx                     landing page
  signup/, login/               auth flows
  [username]/                   public profile + compose flow
  dashboard/                    inbox, settings
  conversations/[id]/           conversation thread
  api/v1/                       REST API (matches PRD §29-33 routes)
lib/
  db.ts        schema + connection
  repo.ts      all data access (swap this file's internals to move to Postgres)
  auth.ts      session cookie helpers
  otp.ts       OTP hashing/generation
  mailer.ts    email — console in dev, has a Resend-shaped stub for prod
  rateLimit.ts in-memory limiter (swap for Redis in prod)
  validation.ts zod schemas + username rules
components/    UI components
```

## Moving to production

In PRD-section order:

1. **§40 Database** — swap `lib/db.ts`/`lib/repo.ts` for Postgres + Prisma
   or Drizzle. The schema is already modeled 1:1 with the PRD's tables, so
   this is a rewrite of the data-access functions, not the app logic above
   them.
2. **§42 Email** — set `RESEND_API_KEY` (or wire another provider) and fill
   in the `deliver()` function in `lib/mailer.ts` — the call site and the
   "never let email failure block message storage" contract are already in
   place.
3. **§49 Rate limiting** — swap `lib/rateLimit.ts`'s in-memory `Map` for
   Redis/Upstash so limits hold across multiple server instances.
4. **§53 Admin console** — not built; the `audit_logs`, `reports`, and user
   `status` fields it needs already exist in the schema.
5. **§73 Security checklist** — HTTPS/HSTS/secure cookies are
   environment/deploy config, not app code; CSRF, XSS and IDOR protections
   for the flows that exist are already in place and were tested against a
   running server (see below).
6. Add the automated test suite the PRD implies but doesn't spec in detail.

## What I actually tested

Not just "it compiles" — I ran the built app and drove it with real HTTP
requests end to end: signup → username claim → a second user verifying by
email and sending the first message (which auto-creates their account) →
receiver's inbox showing it unread → a reply → blocking (and confirming
the blocked sender gets the same generic error either way, never a
"you're blocked" message) → reporting → self-messaging rejection →
reserved-username rejection → an unauthenticated read attempt on someone
else's conversation returning 401. `npm run build` also passes clean
(TypeScript + ESLint).
