"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

const input =
  "mt-1 block min-h-12 w-full rounded-xl border-2 border-line bg-white px-4 text-base focus:border-accent focus:outline-none";

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input className={input} {...props} />
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">
      {children}
    </p>
  );
}

/** better-auth kļūdu kodi → latviski */
function lvError(code?: string, message?: string, status?: number) {
  if (status === 429) return "Pārāk daudz mēģinājumu. Pagaidi minūti un mēģini vēlreiz.";
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Nepareizs e-pasts vai parole.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Konts ar šo e-pastu jau ir. Pieslēdzies vai atjauno paroli.";
    case "PASSWORD_TOO_SHORT":
      return "Parolei jābūt vismaz 8 rakstzīmes garai.";
    case "INVALID_EMAIL":
      return "Pārbaudi e-pasta adresi.";
    case "INVALID_TOKEN":
      return "Saite ir novecojusi vai jau izmantota. Pieprasi jaunu.";
    default:
      return message ? `Neizdevās: ${message}` : "Neizdevās. Mēģini vēlreiz.";
  }
}

function GoogleButton({ next }: { next: string }) {
  return (
    <button
      type="button"
      onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}
      className="btn-secondary w-full"
    >
      Turpināt ar Google
    </button>
  );
}

export function SignInForm({ next, google }: { next: string; google: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (tab === "password") {
      const { error } = await authClient.signIn.email({ email, password });
      setBusy(false);
      if (error) return setError(lvError(error.code, error.message, error.status));
      router.push(next);
      router.refresh();
    } else {
      const { error } = await authClient.signIn.magicLink({ email, callbackURL: next });
      setBusy(false);
      if (error) return setError(lvError(error.code, error.message, error.status));
      setSent(true);
    }
  };

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Pieslēgšanās veids" className="grid grid-cols-2 gap-1 rounded-xl bg-accent-soft p-1">
        {(
          [
            ["password", "Ar paroli"],
            ["link", "Saite e-pastā"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => {
              setTab(k);
              setError(null);
              setSent(false);
            }}
            className={`min-h-11 rounded-lg text-sm font-semibold ${tab === k ? "bg-white text-accent-strong shadow-sm" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {sent ? (
        <div role="status" className="rounded-xl bg-ok-soft p-4 text-ok">
          Saite nosūtīta uz <b>{email}</b>. Atver e-pastu un spied saiti — tā derīga 15 minūtes.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="E-pasts" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {tab === "password" && (
            <Field
              label="Parole"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          {error && <ErrorText>{error}</ErrorText>}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {tab === "password" ? "Pieslēgties" : "Sūtīt saiti"}
          </button>
          {tab === "password" && (
            <p className="text-center text-sm">
              <Link href="/parole/aizmirsta" className="text-accent-strong underline underline-offset-4">
                Aizmirsi paroli?
              </Link>
            </p>
          )}
        </form>
      )}
      {google && <GoogleButton next={next} />}
      <p className="text-center text-sm text-muted">
        Nav konta?{" "}
        <Link href={`/registreties?next=${encodeURIComponent(next)}`} className="font-semibold text-accent-strong underline underline-offset-4">
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
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError(lvError("PASSWORD_TOO_SHORT"));
    setBusy(true);
    const { error } = await authClient.signUp.email({ email, password, name: name.trim() || email.split("@")[0] });
    setBusy(false);
    if (error) return setError(lvError(error.code, error.message, error.status));
    router.push(next);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Vārds (nav obligāts)" name="name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="E-pasts" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Parole (vismaz 8 rakstzīmes)"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-5 accent-accent" />
          <span>
            Piekrītu lietošanas noteikumiem un privātuma politikai.
            {/* TODO 6. posms: saites uz juridiskajām lapām */}
          </span>
        </label>
        {error && <ErrorText>{error}</ErrorText>}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          Izveidot kontu
        </button>
      </form>
      {google && <GoogleButton next={next} />}
      <p className="text-center text-sm text-muted">
        Jau ir konts?{" "}
        <Link href={`/pieslegties?next=${encodeURIComponent(next)}`} className="font-semibold text-accent-strong underline underline-offset-4">
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
      <Field label="E-pasts" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <ErrorText>{error}</ErrorText>}
      <button type="submit" className="btn-primary w-full">Sūtīt saiti</button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(token ? null : lvError("INVALID_TOKEN"));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) return setError(lvError(error.code, error.message, error.status));
    router.push("/pieslegties?parole=mainita");
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Jaunā parole (vismaz 8 rakstzīmes)" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <ErrorText>{error}</ErrorText>}
      <button type="submit" disabled={!token} className="btn-primary w-full disabled:opacity-60">Saglabāt paroli</button>
    </form>
  );
}
