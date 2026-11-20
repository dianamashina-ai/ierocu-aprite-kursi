"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { grantAccessAction } from "@/app/actions/admin";

const input = "mt-1 block min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-accent focus:outline-none";

export function GrantAccessForm({ defaultEmail = "", defaultOpen = false }: { defaultEmail?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState("");
  const [method, setMethod] = useState<"cash" | "free">("cash");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string; userId?: string } | null>(null);
  const [pending, start] = useTransition();

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary min-h-11 px-4 text-sm">
        Piešķirt piekļuvi
      </button>
    );

  return (
    <form
      className="w-full rounded-2xl border border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await grantAccessAction({ email, name: name || undefined, method, note: note || undefined });
          setMsg({ ok: r.ok, text: r.message, userId: "userId" in r ? r.userId : undefined });
          if (r.ok) {
            setEmail("");
            setName("");
            setNote("");
          }
        });
      }}
    >
      <h2 className="font-semibold">Piešķirt pilnu piekļuvi</h2>
      <p className="mt-1 text-sm text-muted">Ja konta ar šo e-pastu nav, tas tiks izveidots un nosūtīts uzaicinājums. Rēķins netiek izrakstīts.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          E-pasts
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-semibold">
          Vārds, uzvārds <span className="font-normal text-muted">(nav obligāts)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Veids</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {(
            [
              ["cash", "Samaksāts skaidrā naudā"],
              ["free", "Bez maksas"],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="method" value={v} checked={method === v} onChange={() => setMethod(v)} className="size-4 accent-accent" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block text-sm font-semibold">
        Piezīme <span className="font-normal text-muted">(nav obligāta)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="piem., instruktors, grupa 12.12." className={input} />
      </label>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`mt-4 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-ok-soft text-ok" : "bg-err-soft text-err"}`}>
          {msg.text}{" "}
          {msg.ok && msg.userId && (
            <Link href={`/admin/lietotaji/${msg.userId}`} className="font-semibold underline underline-offset-2">
              Atvērt lietotāju
            </Link>
          )}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary min-h-11 px-4 text-sm disabled:opacity-60">
          {pending ? "Piešķir…" : "Piešķirt piekļuvi"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost min-h-11 px-4 text-sm">
          Aizvērt
        </button>
      </div>
    </form>
  );
}
