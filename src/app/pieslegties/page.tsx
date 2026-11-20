import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/forms";
import { isGoogleEnabled } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/next";

export const metadata = { title: "Pieslēgties" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; parole?: string; epasts?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Pieslēgties" lead={sp.parole === "mainita" ? "Parole nomainīta. Pieslēdzies ar jauno paroli." : "Progress tiek saglabāts un sinhronizēts visās ierīcēs."}>
      <SignInForm next={next} google={isGoogleEnabled} initialEmail={sp.epasts?.slice(0, 200)} />
    </AuthShell>
  );
}
