import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/forms";
import { isGoogleEnabled } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/next";

export const metadata = { title: "Reģistrēties" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Izveidot kontu" lead="Konts ir bez maksas. Tajā saglabājas progress, kļūdas un izmēģinājuma eksāmeni.">
      <SignUpForm next={next} google={isGoogleEnabled} />
    </AuthShell>
  );
}
