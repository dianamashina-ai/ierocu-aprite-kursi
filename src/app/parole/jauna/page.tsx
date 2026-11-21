import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata = { title: "Jauna parole" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; epasts?: string }> }) {
  const { token, epasts } = await searchParams;
  const invite = Boolean(epasts);
  return (
    <AuthShell
      title={invite ? "Iestati paroli" : "Jauna parole"}
      lead={invite ? "Tev ir atvērta pilna piekļuve kursam. Izveido paroli, lai pieslēgtos." : undefined}
    >
      <ResetPasswordForm token={token ?? null} email={epasts?.slice(0, 200)} />
    </AuthShell>
  );
}
