import "server-only";
import type { CurrentUser } from "@/lib/auth/session";

/**
 * Administratori: ADMIN_EMAILS (ar komatu atdalīti e-pasti) — vides mainīgais, nav repozitorijā.
 * Tikai ar apstiprinātu e-pastu: reģistrācijā e-pastu neapstiprina, tāpēc citādi kāds varētu
 * izveidot kontu ar administratora adresi.
 */
export function isAdmin(user: Pick<CurrentUser, "email" | "emailVerified"> | null | undefined) {
  if (!user?.email || !user.emailVerified) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().replace(/^["'<]+|["'>]+$/g, "").toLowerCase())
    .filter(Boolean);
  return list.includes(user.email.toLowerCase());
}
