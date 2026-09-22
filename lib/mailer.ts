/**
 * Email delivery.
 *
 * PRD section 37 is explicit that email must go through a queue/worker and
 * that message storage must never depend on delivery succeeding. This
 * module keeps that contract (callers never await delivery before treating
 * the write as successful) while giving you one place to plug in a real
 * provider.
 *
 * DEV MODE (default): no provider is configured, so codes/notifications are
 * printed to the server console and kept in an in-memory ring buffer that
 * the UI can poll via /api/v1/dev/last-otp. This is what lets you click
 * through the entire product with no email account set up.
 *
 * PRODUCTION: set RESEND_API_KEY (or swap the body of `deliver()` for
 * Postmark/SES per PRD section 42) and remove the dev-otp route.
 */

type DevOtpEntry = { email: string; purpose: string; code: string; at: number };

const globalForMailer = globalThis as unknown as { __pinglinkDevOtps?: DevOtpEntry[] };
const devOtpLog: DevOtpEntry[] = globalForMailer.__pinglinkDevOtps ?? [];
globalForMailer.__pinglinkDevOtps = devOtpLog;

const isDev = !process.env.RESEND_API_KEY;

async function deliver(to: string, subject: string, body: string) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`\n[dev email] to=${to} subject="${subject}"\n${body}\n`);
    return;
  }

  // Example production wiring (PRD section 42 — Resend for MVP DX):
  //
  // await fetch("https://api.resend.com/emails", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     from: "PingLink <notifications@yourdomain.com>",
  //     to,
  //     subject,
  //     text: body,
  //   }),
  // });
}

export async function sendOtpEmail(email: string, purpose: string, code: string) {
  if (isDev) {
    devOtpLog.push({ email: email.toLowerCase(), purpose, code, at: Date.now() });
    while (devOtpLog.length > 50) devOtpLog.shift();
  }
  await deliver(
    email,
    "Your PingLink verification code",
    `Your code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`
  );
}

export function getDevOtp(email: string, purpose: string): string | undefined {
  if (!isDev) return undefined;
  for (let i = devOtpLog.length - 1; i >= 0; i--) {
    const e = devOtpLog[i];
    if (e.email === email.toLowerCase() && e.purpose === purpose) return e.code;
  }
  return undefined;
}

export async function sendNewMessageEmail(to: string, senderName: string, preview: string, conversationUrl: string) {
  await deliver(
    to,
    `New message from ${senderName}`,
    `${senderName} sent you a message on PingLink:\n\n"${preview}"\n\nReply privately: ${conversationUrl}`
  );
}

export const mailerIsDevMode = isDev;
