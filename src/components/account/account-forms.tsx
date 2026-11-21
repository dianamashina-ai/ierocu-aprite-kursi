"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { ErrorText, Field, lvError, PasswordRules } from "@/components/auth/forms";
import { isStrongPassword } from "@/lib/auth/password-rules";

function Saved({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
      {children}
    </p>
  );
}

export function NameForm({ name }: { name: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        setBusy(true);
        const { error } = await authClient.updateUser({ name: value.trim() });
        setBusy(false);
        if (error) return setError(lvError(error.code, error.message, error.status));
        setSaved(true);
        router.refresh();
      }}
    >
      <Field label="Vārds un uzvārds" name="name" required autoComplete="name" value={value} onChange={(e) => setValue(e.target.value)} maxLength={100} />
      {error && <ErrorText>{error}</ErrorText>}
      {saved && <Saved>Saglabāts.</Saved>}
      <button type="submit" className="btn-secondary" disabled={busy || value.trim() === name}>
        Saglabāt
      </button>
    </form>
  );
}

export function EmailForm({ email }: { email: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSentTo(null);
        const newEmail = value.trim();
        if (newEmail.toLowerCase() === email.toLowerCase()) return setError("Šī jau ir tava e-pasta adrese.");
        setBusy(true);
        const { error } = await authClient.changeEmail({ newEmail, callbackURL: "/konts?epasts=mainits" });
        setBusy(false);
        if (error) return setError(lvError(error.code, error.message, error.status));
        setSentTo(newEmail);
        setValue("");
      }}
    >
      <p className="text-sm text-muted">
        Pašreizējā adrese: <span className="font-semibold text-ink">{email}</span>
      </p>
      <Field label="Jaunā e-pasta adrese" type="email" name="email" autoComplete="email" required value={value} onChange={(e) => setValue(e.target.value)} />
      {error && <ErrorText>{error}</ErrorText>}
      {sentTo && (
        <Saved>
          Uz {sentTo} nosūtījām saiti. Adrese mainīsies, kad to atvērsi. Līdz tam pieslēdzies ar pašreizējo adresi.
        </Saved>
      )}
      <button type="submit" className="btn-secondary" disabled={busy || !value.trim()}>
        Mainīt e-pastu
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        if (next !== repeat) return setError("Jaunās paroles nesakrīt.");
        if (!isStrongPassword(next)) return setError(lvError("WEAK_PASSWORD"));
        setBusy(true);
        const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
        setBusy(false);
        if (error) return setError(lvError(error.code, error.message, error.status));
        setSaved(true);
        setCurrent("");
        setNext("");
        setRepeat("");
      }}
    >
      <Field label="Pašreizējā parole" type="password" name="current-password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      <div>
        <Field label="Jaunā parole" type="password" name="new-password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
        <PasswordRules />
      </div>
      <Field label="Jaunā parole vēlreiz" type="password" name="repeat-password" autoComplete="new-password" required minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      {error && <ErrorText>{error}</ErrorText>}
      {saved && <Saved>Parole nomainīta. Citās ierīcēs būs jāpieslēdzas no jauna.</Saved>}
      <button type="submit" className="btn-secondary" disabled={busy}>
        Mainīt paroli
      </button>
    </form>
  );
}
