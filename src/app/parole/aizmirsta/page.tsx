import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata = { title: "Aizmirsta parole" };

export default function ForgotPage() {
  return (
    <AuthShell title="Aizmirsi paroli?" lead="Ievadi e-pastu, un nosūtīsim saiti jaunas paroles iestatīšanai.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
