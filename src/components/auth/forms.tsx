"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { isStrongPassword, PASSWORD_RULES, WEAK_PASSWORD_MESSAGE } from "@/lib/auth/password-rules";
import { authClient } from "@/lib/auth/client";


export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input className={`mt-1 ${FIELD_CLASS}`} {...props} />
    </label>
  );
}

/** Pieslēgšanās lapu lauks: pelēks fons, noapaļots; paroles laukam — rādīt/slēpt. */
/** Teksta lauka stils visā vietnē (fokusā — tikai vispārējā zīmola apmale, sk. globals.css :focus-visible). */
export const FIELD_CLASS =
  "block min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base placeholder:text-muted focus:bg-white";
const authInput = FIELD_CLASS;

export function AuthField({ label, type, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <span className="relative mt-1 block">
        <input type={isPassword && show ? "text" : type} className={`${authInput} ${isPassword ? "pr-12" : ""}`} {...props} />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Slēpt paroli" : "Rādīt paroli"}
            className="absolute inset-y-0 right-1 my-auto inline-flex size-10 items-center justify-center rounded-lg text-muted hover:text-ink"
          >
            {show ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        )}
      </span>
    </label>
  );
}

/** Paroles prasības zem lauka — mazs teksts, punktu saraksts. */
export function PasswordRules() {
  return (
    <div className="mt-2 text-xs text-muted">
      <p>Parolē jābūt vismaz:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {PASSWORD_RULES.map((r) => (
          <li key={r.id}>{r.label}</li>
        ))}
      </ul>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      vai
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">
      {children}
    </p>
  );
}

/** better-auth kļūdu kodi → latviski */
export function lvError(code?: string, message?: string, status?: number) {
  if (status === 429) return "Pārāk daudz mēģinājumu. Pagaidi minūti un mēģini vēlreiz.";
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Nepareizs e-pasts vai parole.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Konts ar šo e-pastu jau ir. Pieslēdzies vai atjauno paroli.";
    case "PASSWORD_TOO_SHORT":
    case "WEAK_PASSWORD":
      return WEAK_PASSWORD_MESSAGE;
    case "NAME_REQUIRED":
      return "Norādi vārdu un uzvārdu.";
    case "INVALID_EMAIL":
      return "Pārbaudi e-pasta adresi.";
    case "INVALID_PASSWORD":
      return "Pašreizējā parole nav pareiza.";
    case "CREDENTIAL_ACCOUNT_NOT_FOUND":
      return "Tavam kontam vēl nav paroles. Iestati to ar “Aizmirsi paroli?” pieslēgšanās lapā.";
    case "PASSWORD_TOO_LONG":
      return "Parole ir pārāk gara.";
    case "INVALID_TOKEN":
      return "Saite ir novecojusi vai jau izmantota. Pieprasi jaunu.";
    default:
      return message ? `Neizdevās: ${message}` : "Neizdevās. Mēģini vēlreiz.";
  }
}

export function GoogleButton({ next }: { next: string }) {
  return (
    <button
      type="button"
      onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: "/pieslegties" })}
      className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-5 font-semibold text-ink transition-colors hover:border-ink hover:bg-surface"
    >
      <GoogleIcon />
      Turpināt ar Google
    </button>
  );
}

function Consent({ google }: { google: boolean }) {
  return (
    <p className="text-center text-xs leading-relaxed text-muted">
      {google ? "Turpinot tu piekrīti" : "Izveidojot kontu, tu piekrīti"}{" "}
      <Link href="/noteikumi" target="_blank" className="underline underline-offset-2 hover:text-ink">
        lietošanas noteikumiem
      </Link>{" "}
      un{" "}
      <Link href="/privatums" target="_blank" className="underline underline-offset-2 hover:text-ink">
        privātuma politikai
      </Link>
      .
    </p>
  );
}

export function SignInForm({ next, google, initialEmail }: { next: string; google: boolean; initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (error) return setError(lvError(error.code, error.message, error.status));
    router.push(next);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {google && (
        <>
          <GoogleButton next={next} />
          <OrDivider />
        </>
      )}
      <form onSubmit={submit} className="space-y-4">
        <AuthField label="E-pasts" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <AuthField
            label="Parole"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-2 text-right text-sm">
            <Link href="/parole/aizmirsta" className="text-muted underline-offset-4 hover:text-ink hover:underline">
              Aizmirsi paroli?
            </Link>
          </p>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          Pieslēgties
        </button>
      </form>
      <p className="pt-2 text-center text-sm text-muted">
        Nav konta?{" "}
        <Link href={`/registreties?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline underline-offset-4">
          Reģistrēties
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm({ next, google }: { next: string; google: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError(lvError("NAME_REQUIRED"));
    if (!isStrongPassword(password)) return setError(lvError("WEAK_PASSWORD"));
    setBusy(true);
    const { error } = await authClient.signUp.email({ email, password, name: name.trim() });
    setBusy(false);
    if (error) return setError(lvError(error.code, error.message, error.status));
    router.push(next);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {google && (
        <>
          <GoogleButton next={next} />
          <OrDivider />
        </>
      )}
      <form onSubmit={submit} className="space-y-4">
        <AuthField label="Vārds un uzvārds" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <AuthField label="E-pasts" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <AuthField
            label="Parole"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordRules />
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          Izveidot kontu
        </button>
      </form>
      <Consent google={google} />
      <p className="text-center text-sm text-muted">
        Jau ir konts?{" "}
        <Link href={`/pieslegties?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline underline-offset-4">
          Pieslēgties
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/parole/jauna" });
    if (error) return setError(lvError(error.code, error.message, error.status));
    setSent(true);
  };
  return sent ? (
    <p role="status" className="rounded-xl bg-ok-soft p-4 text-ok">
      Ja konts ar <b>{email}</b> eksistē, nosūtījām saiti paroles maiņai.
    </p>
  ) : (
    <form onSubmit={submit} className="space-y-4">
      <AuthField label="E-pasts" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <ErrorText>{error}</ErrorText>}
      <button type="submit" className="btn-primary w-full">Sūtīt saiti</button>
      <p className="text-center text-sm text-muted">
        <Link href="/pieslegties" className="underline underline-offset-4 hover:text-ink">Atpakaļ uz pieslēgšanos</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token, email }: { token: string | null; email?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : lvError("INVALID_TOKEN"));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!isStrongPassword(password)) return setError(lvError("WEAK_PASSWORD"));
    setError(null);
    setBusy(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      setBusy(false);
      return setError(lvError(error.code, error.message, error.status));
    }
    // uzaicinājums (zināms e-pasts) — uzreiz pieslēdzam
    if (email) {
      const r = await authClient.signIn.email({ email, password });
      if (!r.error) {
        router.push("/");
        router.refresh();
        return;
      }
    }
    router.push("/pieslegties?parole=mainita");
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {email && (
        <p className="rounded-xl bg-surface px-4 py-3 text-sm">
          E-pasts: <span className="font-semibold">{email}</span>
        </p>
      )}
      <div>
        <AuthField label="Jaunā parole" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordRules />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <button type="submit" disabled={!token || busy} className="btn-primary w-full disabled:opacity-60">
        {email ? "Saglabāt un sākt mācīties" : "Saglabāt paroli"}
      </button>
      {!token || error ? (
        <p className="text-center text-sm text-muted">
          <Link href="/parole/aizmirsta" className="underline underline-offset-4 hover:text-ink">Pieprasīt jaunu saiti</Link>
        </p>
      ) : null}
    </form>
  );
}
