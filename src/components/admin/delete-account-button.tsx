"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/app/actions/admin";

/** Konta dzēšana ar apstiprinājumu; ja ir rēķini — otrs, skaidrs apstiprinājums (tikai testa maksājumiem). */
export function DeleteAccountButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "invoices">("idle");
  const [invoiced, setInvoiced] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (withInvoices: boolean) =>
    start(async () => {
      setError(null);
      const r = await deleteAccountAction(userId, withInvoices);
      if (r.ok) return router.push("/admin/lietotaji");
      if (r.invoiced) {
        setInvoiced(r.invoiced);
        setStep("invoices");
      } else setError(r.message);
    });

  return (
    <div className="space-y-3">
      {step === "idle" && (
        <button type="button" onClick={() => setStep("confirm")} className="btn-secondary min-h-10 px-4 text-sm text-err">
          Dzēst kontu
        </button>
      )}
      {step === "confirm" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">
            Neatgriezeniski dzēst <strong className="break-all">{email}</strong> ar progresu un pasūtījumiem?
          </span>
          <button type="button" disabled={pending} onClick={() => run(false)} className="inline-flex min-h-10 items-center rounded-lg bg-err px-4 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Dzēš…" : "Jā, dzēst"}
          </button>
          <button type="button" disabled={pending} onClick={() => setStep("idle")} className="btn-ghost min-h-10 px-3 text-sm">
            Atcelt
          </button>
        </div>
      )}
      {step === "invoices" && (
        <div className="space-y-2 rounded-xl bg-warn-soft p-4 text-sm text-warn">
          <p>
            Kontam ir <strong>{invoiced}</strong> rēķini. Dzēs tikai tad, ja tie ir <strong>testa maksājumi</strong> (piem., Montonio testa
            režīmā). Īstu klientu rēķini jāsaglabā grāmatvedībai.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={() => run(true)} className="inline-flex min-h-10 items-center rounded-lg bg-err px-4 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Dzēš…" : "Dzēst kopā ar rēķiniem"}
            </button>
            <button type="button" disabled={pending} onClick={() => setStep("idle")} className="btn-ghost min-h-10 px-3 text-sm">
              Atcelt
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-err">{error}</p>}
    </div>
  );
}
