import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./index";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  /** E-pasts apstiprināts (Google, paroles iestatīšana pēc saites vai e-pasta maiņa) */
  emailVerified: boolean;
}

/** Pašreizējais lietotājs vai null (kešots viena pieprasījuma ietvaros). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const s = await auth.api.getSession({ headers: await headers() });
  return s ? { id: s.user.id, email: s.user.email, name: s.user.name, emailVerified: Boolean(s.user.emailVerified) } : null;
});

export async function requireUser(next: string): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect(`/pieslegties?next=${encodeURIComponent(next)}`);
  return u;
}
