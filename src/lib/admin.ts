import "server-only";
import type { CurrentUser } from "@/lib/auth/session";

/** Administratori: ADMIN_EMAILS (ar komatu atdalīti e-pasti) — vides mainīgais, nav repozitorijā. */
export function isAdmin(user: Pick<CurrentUser, "email"> | null | undefined) {
  if (!user?.email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().replace(/^["'<]+|["'>]+$/g, "").toLowerCase())
    .filter(Boolean);
  return list.includes(user.email.toLowerCase());
}
