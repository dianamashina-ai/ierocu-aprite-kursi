"use client";

import { useState, useTransition } from "react";
import { deleteTestAccountsAction } from "@/app/actions/admin";

type Row = { id: string; email: string; created: string; orders: number; invoiced: number };

/** Administrācija: testa kontu (@example.com) saraksts un dzēšana ar apstiprinājumu. */
export function TestAccountsCleanup({ rows }: { rows: Row[] }) {
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const deletable = rows.filter((r) => r.invoiced === 0);

  return (
    <section aria-labelledby="test-h" className="mt-12 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 id="test-h" className="text-xl font-semibold">
        Testa konti <span className="text-base font-normal text-muted">· e-pasts @example.com</span>
      </h2>
      {msg ? (
        <p role="status" className="mt-3 text-sm text-ok">{msg}</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Testa kontu nav.</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-line text-sm">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
                <span className="break-all font-semibold">{r.email}</span>
                <span className="text-muted">
                  {r.created} · pasūtījumi: {r.orders}
                  {r.invoiced > 0 && <span className="font-semibold text-warn"> · ir rēķins — netiks dzēsts</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Dzēš kontus, to progresu, ierīces un neapmaksātos pasūtījumus. Kontus ar rēķinu nedzēš.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!confirm ? (
              <button type="button" disabled={!deletable.length} onClick={() => setConfirm(true)} className="btn-secondary min-h-10 px-4 text-sm disabled:opacity-50">
                Dzēst {deletable.length} testa kontus
              </button>
            ) : (
              <>
                <span className="text-sm">Neatgriezeniski dzēst {deletable.length} kontus?</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await deleteTestAccountsAction();
                      setMsg(r.message);
                    })
                  }
                  className="inline-flex min-h-10 items-center rounded-lg bg-err px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pending ? "Dzēš…" : "Jā, dzēst"}
                </button>
                <button type="button" disabled={pending} onClick={() => setConfirm(false)} className="btn-ghost min-h-10 px-3 text-sm">
                  Atcelt
                </button>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
