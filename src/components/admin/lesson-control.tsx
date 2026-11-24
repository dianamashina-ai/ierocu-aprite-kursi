"use client";

import { useState, useTransition } from "react";
import { scheduleLessonAction, setLessonDoneAction } from "@/app/actions/admin";

type Props = { orderId: string; status: "scheduled" | "done" | "refunded" | null; local: string | null; label: string | null };

const badge = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

/** Administratoram: praktiskās nodarbības statuss un laiks pasūtījumā. */
export function LessonControl({ orderId, status, local, label }: Props) {
  const [value, setValue] = useState(local ?? "");
  const [editing, setEditing] = useState(!status);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) setEditing(false);
    });

  if (status === "refunded")
    return (
      <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm">
        <span className="font-semibold">Nodarbība:</span>
        <span className={`${badge} bg-err-soft text-err`}>Atmaksāta</span>
        <span className="text-muted">pircējs atteicās; kurss paliek pieejams</span>
      </div>
    );
  return (
    <div className="space-y-2 rounded-xl bg-surface px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">Nodarbība:</span>
        {status === "done" ? (
          <span className={`${badge} bg-ok-soft text-ok`}>Notikusi</span>
        ) : status === "scheduled" ? (
          <span className={`${badge} bg-accent-soft text-ink`}>Saskaņota</span>
        ) : (
          <span className={`${badge} bg-warn-soft text-warn`}>Jāsazinās</span>
        )}
        {label && <span className="tabular-nums">{label}</span>}
        {!editing && status !== "done" && (
          <button type="button" onClick={() => setEditing(true)} className="btn-ghost min-h-8 px-2 text-sm">
            Mainīt laiku
          </button>
        )}
        {status === "scheduled" && !editing && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setLessonDoneAction(orderId, true))}
            className="btn-secondary min-h-8 px-3 text-sm"
          >
            Atzīmēt kā notikušu
          </button>
        )}
        {status === "done" && (
          <button type="button" disabled={pending} onClick={() => run(() => setLessonDoneAction(orderId, false))} className="btn-ghost min-h-8 px-2 text-sm">
            Atcelt atzīmi
          </button>
        )}
      </div>
      {editing && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => scheduleLessonAction(orderId, value));
          }}
        >
          <label className="sr-only" htmlFor={`lesson-${orderId}`}>
            Nodarbības datums un laiks
          </label>
          <input
            id={`lesson-${orderId}`}
            type="datetime-local"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-9 rounded-lg border border-line bg-white px-2 text-sm"
          />
          <button type="submit" disabled={pending || !value} className="btn-primary min-h-9 px-3 text-sm disabled:opacity-60">
            {pending ? "Saglabā…" : "Saglabāt un paziņot"}
          </button>
          {status && (
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost min-h-9 px-2 text-sm">
              Atcelt
            </button>
          )}
        </form>
      )}
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-ok" : "text-err"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
