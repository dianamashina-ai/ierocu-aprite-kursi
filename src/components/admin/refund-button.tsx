"use client";

import { useState, useTransition } from "react";
import { refundOrderAction } from "@/app/actions/admin";

export function RefundButton({ orderId, label }: { orderId: string; label: string }) {
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (msg?.ok) return <p role="status" className="text-sm text-ok">{msg.text}</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!confirm ? (
        <button type="button" onClick={() => setConfirm(true)} className="btn-ghost min-h-9 px-3 text-sm">
          Atmaksāt
        </button>
      ) : (
        <>
          <span className="text-sm">Atmaksāt {label} un slēgt piekļuvi?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await refundOrderAction(orderId);
                setMsg({ ok: r.ok, text: r.message });
                if (!r.ok) setConfirm(false);
              })
            }
            className="inline-flex min-h-9 items-center rounded-lg bg-err px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Atmaksā…" : "Jā, atmaksāt"}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirm(false)} className="btn-ghost min-h-9 px-3 text-sm">
            Atcelt
          </button>
        </>
      )}
      {msg && !msg.ok && <p role="alert" className="w-full text-sm text-err">{msg.text}</p>}
    </div>
  );
}
