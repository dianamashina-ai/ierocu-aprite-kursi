"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useState } from "react";
import { CreditCard, Landmark } from "lucide-react";
import { checkoutAction, type CheckoutState } from "@/app/actions/billing";
import type { PayMethod } from "@/lib/billing/types";

const METHOD_LABEL: Record<PayMethod, { title: string; hint: string; Icon: typeof Landmark }> = {
  bank: { title: "Internetbanka", hint: "Swedbank, SEB, Citadele, Luminor", Icon: Landmark },
  card: { title: "Karte, Apple Pay, Google Pay", hint: "Visa, Mastercard", Icon: CreditCard },
};

const input = "mt-1 block min-h-12 w-full rounded-xl border-2 border-line bg-white px-4 text-base";

export function CheckoutForm({
  email,
  defaultName,
  priceLabel,
  product,
  methods = [],
}: {
  email: string;
  defaultName: string;
  priceLabel: string;
  product?: "test";
  methods?: PayMethod[];
}) {
  const [method, setMethod] = useState<PayMethod>(methods[0] ?? "bank");
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkoutAction, {});
  const f = state.fields ?? {};

  return (
    <form action={action} className="space-y-5">
      {product && <input type="hidden" name="product" value={product} />}
      <label className="block">
        <span className="text-sm font-semibold">Vārds, uzvārds (rēķinam)</span>
        <input name="name" required autoComplete="name" defaultValue={f.name ?? defaultName} className={input} />
      </label>
      <p className="text-sm text-muted">
        Rēķins tiks nosūtīts uz <strong className="text-ink">{email}</strong>.
      </p>

      <div className="space-y-3 border-t border-line pt-5">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="terms" required defaultChecked={f.terms === "on"} className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]" />
          <span className="text-sm">
            Esmu iepazinies un piekrītu{" "}
            <Link href="/noteikumi" target="_blank" className="font-semibold text-accent-strong underline underline-offset-2">
              lietošanas un pirkšanas noteikumiem
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="waiver" required defaultChecked={f.waiver === "on"} className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]" />
          <span className="text-sm">
            Piekrītu, ka piekļuve digitālajam saturam tiek nodrošināta uzreiz pēc apmaksas, un apzinos, ka tādējādi zaudēju
            14 dienu atteikuma tiesības.
          </span>
        </label>
      </div>

      {methods.length > 1 ? (
        <fieldset className="space-y-2 border-t border-line pt-5">
          <legend className="text-sm font-semibold">Maksāšanas veids</legend>
          {methods.map((m) => {
            const { title, hint, Icon } = METHOD_LABEL[m];
            return (
              <label
                key={m}
                className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-line bg-white px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
              >
                <input
                  type="radio"
                  name="method"
                  value={m}
                  checked={method === m}
                  onChange={() => setMethod(m)}
                  className="size-5 shrink-0 accent-[var(--color-accent)]"
                />
                <Icon aria-hidden="true" className="size-5 shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted">{hint}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : (
        methods[0] && <input type="hidden" name="method" value={methods[0]} />
      )}

      {state.error && (
        <p role="alert" className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
        {pending ? "Notiek pāradresācija…" : `Maksāt ${priceLabel}`}
      </button>
    </form>
  );
}
