"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveExplanationAction } from "@/app/actions/admin";

const field = "mt-1 block w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-base leading-relaxed";

export function ExplanationEditor(props: {
  id: number;
  explanation: string | null;
  lawReference: string | null;
  outdatedNote: string | null;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [explanation, setExplanation] = useState(props.explanation ?? "");
  const [lawReference, setLawReference] = useState(props.lawReference ?? "");
  const [outdatedNote, setOutdatedNote] = useState(props.outdatedNote ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const save = (status: "draft" | "reviewed", goNext = false) =>
    start(async () => {
      const r = await saveExplanationAction({ id: props.id, explanation, lawReference, outdatedNote, status });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok && goNext && props.nextHref) router.push(props.nextHref);
      else router.refresh();
    });

  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <label className="block">
        <span className="text-sm font-semibold">Skaidrojums</span>
        <textarea rows={7} value={explanation} onChange={(e) => setExplanation(e.target.value)} className={field} />
        <span className="mt-1 block text-xs text-muted">Neraksti «pirmais variants» vai burtus — skolēnam varianti ir sajaukti.</span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Avots</span>
        <input value={lawReference} onChange={(e) => setLawReference(e.target.value)} className={field} placeholder="piem., Ieroču aprites likums, 16. panta 2. daļa" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Likuma izmaiņas (ja ir)</span>
        <textarea rows={3} value={outdatedNote} onChange={(e) => setOutdatedNote(e.target.value)} className={field} />
        <span className="mt-1 block text-xs text-muted">Ja aizpildīts, pie jautājuma rāda brīdinājumu «Likuma izmaiņas».</span>
      </label>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-ok-soft text-ok" : "bg-err-soft text-err"}`}>
          {msg.text}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending} onClick={() => save("reviewed")} className="btn-primary disabled:opacity-60">
          Pārbaudīts — saglabāt
        </button>
        {props.nextHref && (
          <button type="button" disabled={pending} onClick={() => save("reviewed", true)} className="btn-secondary disabled:opacity-60">
            Pārbaudīts — uz nākamo →
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => save("draft")} className="btn-ghost disabled:opacity-60">
          Saglabāt kā melnrakstu
        </button>
      </div>
    </form>
  );
}
