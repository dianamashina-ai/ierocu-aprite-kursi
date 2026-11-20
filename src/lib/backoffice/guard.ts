import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";

/** Administratora lapām: neiepieslēgtos sūta pieslēgties, pārējiem — 404 (neatklāj, ka lapa eksistē). */
export async function requireAdminPage(path: string) {
  const user = await requireUser(path);
  if (!isAdmin(user)) notFound();
  return user;
}
