import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/forms";
import { isGoogleEnabled } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/next";

export const metadata = { title: "Pieslēgties" };

/** Google pieslēgšanās kļūdas (better-auth ?error=…) → latviski */
function oauthError(code: string) {
  switch (code) {
    case "access_denied":
      return "Pieslēgšanās ar Google tika atcelta.";
    case "account_not_linked":
      return "Konts ar šo e-pastu jau ir. Pieslēdzies ar paroli vai saiti e-pastā.";
    case "state_mismatch":
    case "please_restart_the_process":
      return "Pieslēgšanās sesija beidzās. Mēģini vēlreiz.";
    default:
      return "Pieslēgties ar Google neizdevās. Mēģini vēlreiz vai izmanto e-pastu.";
  }
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; parole?: string; epasts?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Sveiki atpakaļ!" error={sp.error ? oauthError(sp.error) : undefined} lead={sp.parole === "mainita" ? "Parole nomainīta. Pieslēdzies ar jauno paroli." : "Pieslēdzies, lai turpinātu mācības."}>
      <SignInForm next={next} google={isGoogleEnabled} initialEmail={sp.epasts?.slice(0, 200)} />
    </AuthShell>
  );
}
