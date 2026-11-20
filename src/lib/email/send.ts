import "server-only";

/**
 * E-pasta sūtīšana. Ja iestatīts RESEND_API_KEY — sūta caur Resend;
 * citādi (izstrāde, testi) — izdrukā konsolē un saglabā atmiņā (/api/dev/outbox).
 */
export interface Email {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const outbox: (Email & { sentAt: string })[] = [];
export const devOutbox = () => outbox;

export async function sendEmail(email: Email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    outbox.unshift({ ...email, sentAt: new Date().toISOString() });
    outbox.length = Math.min(outbox.length, 50);
    console.log(`\n✉️  [dev e-pasts] → ${email.to}\n   ${email.subject}\n   ${email.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Ieroču atļauja <noreply@example.com>",
      to: email.to,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend: ${res.status} ${await res.text()}`);
}
