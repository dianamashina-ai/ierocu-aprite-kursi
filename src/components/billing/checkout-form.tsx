"use client";

import Link from "next/link";
import { useActionState } from "react";
import { checkoutAction, type CheckoutState } from "@/app/actions/billing";

const input = "mt-1 block min-h-12 w-full rounded-xl border-2 border-line bg-white px-4 text-base focus:border-accent focus:outline-none";

export function CheckoutForm({ email, defaultName, priceLabel }: { email: string; defaultName: string; priceLabel: string }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkoutAction, {});
  const f = state.fields ?? {};

  return (
    <form action={action} className="space-y-5">
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
