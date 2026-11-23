"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { CreditCard, Landmark } from "lucide-react";
import { checkoutAction, type CheckoutState } from "@/app/actions/billing";
import type { PayMethod } from "@/lib/billing/types";
import { PAY_LOGOS } from "@/components/billing/pay-logo-paths";
import { authClient } from "@/lib/auth/client";
import { isStrongPassword } from "@/lib/auth/password-rules";
import {
  AuthField,
  FIELD_CLASS,
  GoogleButton,
  GoogleIcon,
  lvError,
  OrDivider,
  PasswordRules,
} from "@/components/auth/forms";
import {
  LESSON_SCHEDULING,
  productByCode,
  type ProductCode,
} from "@/config/pricing";

const METHOD_LABEL: Record<
  PayMethod,
  { title: string; hint: string; Icon: typeof Landmark }
> = {
  bank: {
    title: "Internetbanka",
    hint: "Swedbank, SEB, Citadele, Luminor",
    Icon: Landmark,
  },
  card: {
    title: "Karte, Apple Pay, Google Pay",
    hint: "Visa, Mastercard, Apple Pay, Google Pay",
    Icon: CreditCard,
  },
};

const input = `mt-1 ${FIELD_CLASS}`;

/** Maksājumu zīmola zīme mazā baltā “kartītē”. */
function PayLogo({ id }: { id: keyof typeof PAY_LOGOS }) {
  const l = PAY_LOGOS[id];
  // visām zīmēm — vienāda izmēra kartīte, zīme centrā aptuveni vienā platumā
  const chip = "inline-flex h-7 w-12 items-center justify-center rounded-md border border-line bg-white";
  if (id === "googlepay")
    // krāsainais G + pelēks “Pay”, kā oriģinālajā zīmē
    return (
      <span className={`${chip} gap-px`} title={l.title} role="img" aria-label={l.title}>
        <GoogleIcon className="size-2.5" />
        <span aria-hidden="true" className="text-[10px] leading-none font-medium text-[#5F6368]">
          Pay
        </span>
      </span>
    );
  if (id === "mastercard")
    // krāsainā zīme: sarkans un dzeltens aplis, pārklājums — oranžs
    return (
      <span className={chip} title={l.title}>
        <svg role="img" aria-label={l.title} viewBox="0 0 32 20" className="h-3.5 w-auto">
          <defs>
            <clipPath id="mc-left">
              <circle cx="10" cy="10" r="10" />
            </clipPath>
          </defs>
          <circle cx="10" cy="10" r="10" fill="#EB001B" />
          <circle cx="22" cy="10" r="10" fill="#F79E1B" />
          <circle cx="22" cy="10" r="10" fill="#FF5F00" clipPath="url(#mc-left)" />
        </svg>
      </span>
    );
  return (
    <span className={chip} title={l.title}>
      <svg role="img" aria-label={l.title} viewBox="0 0 24 24" className={id === "visa" ? "w-7" : "w-6"} fill={l.hex}>
        <path d={l.path} />
      </svg>
    </span>
  );
}

export function CheckoutForm({
  email,
  defaultName,
  priceLabel,
  product,
  methods = [],
  guest = false,
  google = false,
  returnTo = "/iegadaties",
}: {
  /** Viesis: forma arī izveido kontu (vārds, e-pasts, parole), tad turpina uz apmaksu */
  guest?: boolean;
  google?: boolean;
  /** Pirkuma lapa (atgriešanās pēc Google / pieslēgšanās) */
  returnTo?: string;
  email: string;
  defaultName: string;
  priceLabel: string;
  product: ProductCode;
  methods?: PayMethod[];
}) {
  const [method, setMethod] = useState<PayMethod>(methods[0] ?? "bank");
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    checkoutAction,
    {},
  );
  const f = state.fields ?? {};
  const loginHref = `/pieslegties?next=${encodeURIComponent(returnTo)}`;
  const p = productByCode(product);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // konts jau izveidots šajā lapā (piem., apmaksa neizdevās) — otrreiz nereģistrējam
  const [created, setCreated] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!guest || created) return; // pieslēgtam lietotājam — parasta servera darbība
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    setSignupError(null);
    if (name.length < 2) return setSignupError(lvError("NAME_REQUIRED"));
    if (!isStrongPassword(password))
      return setSignupError(lvError("WEAK_PASSWORD"));
    setBusy(true);
    const { error } = await authClient.signUp.email({
      email: String(fd.get("email") ?? "").trim(),
      password,
      name,
    });
    setBusy(false);
    if (error)
      return setSignupError(lvError(error.code, error.message, error.status));
    setCreated(true);
    fd.delete("password");
    startTransition(() => action(fd));
  };

  return (
    <div className="space-y-5">
      {guest && google && !created && (
        <>
          <GoogleButton next={returnTo} />
          <OrDivider />
        </>
      )}
      <form action={action} onSubmit={onSubmit} className="space-y-5">
        <input type="hidden" name="product" value={product} />
        <label className="block">
          <span className="text-sm font-semibold">
            Vārds, uzvārds (rēķinam)
          </span>
          <input
            name="name"
            required
            autoComplete="name"
            defaultValue={f.name ?? defaultName}
            className={input}
          />
        </label>
        {guest && !created && (
          <>
            <AuthField
              label="E-pasts"
              type="email"
              name="email"
              autoComplete="email"
              required
              defaultValue={f.email ?? ""}
            />
            <div>
              <AuthField
                label="Parole"
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <PasswordRules />
            </div>
          </>
        )}
        {p.includesLesson && (
          <label className="block">
            <span className="text-sm font-semibold">Tālrunis</span>
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="+371 20000000"
              defaultValue={f.phone ?? ""}
              className={input}
            />
            <span className="mt-1 block text-sm text-muted">
              {LESSON_SCHEDULING}
            </span>
          </label>
        )}
        {guest ? (
          !created && (
            <p className="text-sm text-muted">
              Tiks izveidots konts — tajā būs pirkums, progress un rēķini. Jau
              ir konts?{" "}
              <Link
                href={loginHref}
                className="font-semibold text-ink underline underline-offset-4"
              >
                Pieslēgties
              </Link>
            </p>
          )
        ) : (
          <p className="text-sm text-muted">
            Rēķins tiks nosūtīts uz{" "}
            <strong className="text-ink">{email}</strong>.
          </p>
        )}

        <div className="space-y-3 border-t border-line pt-5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="terms"
              required
              defaultChecked={f.terms === "on"}
              className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]"
            />
            <span className="text-sm">
              Esmu iepazinies un piekrītu{" "}
              <Link
                href="/noteikumi"
                target="_blank"
                className="font-semibold text-accent-strong underline underline-offset-2"
              >
                lietošanas un pirkšanas noteikumiem
              </Link>
              .
            </span>
          </label>
          {p.includesCourse && (
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="waiver"
                required
                defaultChecked={f.waiver === "on"}
                className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="text-sm">
                Piekrītu, ka piekļuve digitālajam saturam tiek nodrošināta
                uzreiz pēc apmaksas, un apzinos, ka tādējādi zaudēju 14 dienu
                atteikuma tiesības
                {p.includesLesson ? " uz tiešsaistes kursu" : ""}.
              </span>
            </label>
          )}
        </div>

        {methods.length > 1 ? (
          <fieldset className="space-y-2 border-t border-line pt-5">
            <legend className="float-left mb-3 w-full text-sm font-semibold">Maksāšanas veids</legend>
            {methods.map((m) => {
              const { title, hint, Icon } = METHOD_LABEL[m];
              return (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 has-[:checked]:border-accent has-[:checked]:ring-1 has-[:checked]:ring-accent"
                >
                  <input
                    type="radio"
                    name="method"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="size-5 shrink-0 accent-[var(--color-accent)]"
                  />
                  <Icon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">{title}</span>
                    {m === "card" ? (
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        <PayLogo id="visa" />
                        <PayLogo id="mastercard" />
                        <PayLogo id="applepay" />
                        <PayLogo id="googlepay" />
                      </span>
                    ) : (
                      <span className="block text-sm text-muted">{hint}</span>
                    )}
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          methods[0] && <input type="hidden" name="method" value={methods[0]} />
        )}

        {signupError && (
          <p
            role="alert"
            className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err"
          >
            {signupError}
          </p>
        )}
        {state.error && (
          <p
            role="alert"
            className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err"
          >
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || busy}
          className="btn-primary w-full"
        >
          {busy
            ? "Izveido kontu…"
            : pending
              ? "Notiek pāradresācija…"
              : `Maksāt ${priceLabel}`}
        </button>
      </form>
    </div>
  );
}
