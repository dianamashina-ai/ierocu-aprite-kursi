import "server-only";
import type { CurrentUser } from "@/lib/auth/session";

/**
 * Administratori: ADMIN_EMAILS (ar komatu atdalīti e-pasti) — vides mainīgais, nav repozitorijā.
 * Tikai ar apstiprinātu e-pastu: reģistrācijā e-pastu neapstiprina, tāpēc citādi kāds varētu
 * izveidot kontu ar administratora adresi.
 */
export function isAdmin(user: Pick<CurrentUser, "email" | "emailVerified"> | null | undefined) {
  return adminStatus(user) === "admin";
}

const adminList = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().replace(/^["'<]+|["'>]+$/g, "").toLowerCase())
    .filter(Boolean);

/** Kāpēc lietotājs ir / nav administrators (diagnostikai administrācijā). */
export function adminStatus(user: Pick<CurrentUser, "email" | "emailVerified"> | null | undefined): "admin" | "not-listed" | "unverified" {
  if (!user?.email || !adminList().includes(user.email.toLowerCase())) return "not-listed";
  return user.emailVerified ? "admin" : "unverified";
}
