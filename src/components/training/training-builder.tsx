"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { plural } from "@/lib/format";

export interface BuilderTopic {
  id: string;
  title: string;
  questions: number;
  mistakes: number;
}

export interface BuilderModule {
  id: string;
  order: number;
  title: string;
  locked: boolean;
  topics: BuilderTopic[];
}

const COUNTS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 40, label: "40" },
  { value: 0, label: "Visi" },
] as const;

/** Treniņa izvēle: tēmas (moduļu grupās), “tikai kļūdas”, jautājumu skaits → /trenins/sakt?… */
export function TrainingBuilder({ modules }: { modules: BuilderModule[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [limit, setLimit] = useState<number>(20);

  const available = useMemo(() => modules.filter((m) => !m.locked).flatMap((m) => m.topics), [modules]);
  const chosen = available.filter((t) => selected.has(t.id));
  const pool = chosen.reduce((s, t) => s + (mistakesOnly ? t.mistakes : t.questions), 0);
  const total = limit > 0 ? Math.min(limit, pool) : pool;
  const anyMistakes = chosen.some((t) => t.mistakes > 0);

  const toggle = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const start = () => {
    const p = new URLSearchParams({ temas: chosen.map((t) => t.id).join(",") });
    if (mistakesOnly) p.set("kludas", "1");
    if (limit > 0) p.set("skaits", String(limit));
    router.push(`/trenins/sakt?${p}`);
  };

  return (
    <div className="grid gap-8 pb-24 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-12 lg:pb-0">
      <fieldset>
        <div className="flex items-center justify-between gap-3">
          <legend className="text-xl font-semibold">Tēmas</legend>
          <div className="flex gap-1 text-sm">
            <button type="button" onClick={() => toggle(available.map((t) => t.id), true)} className="rounded-lg px-2 py-1 text-muted hover:bg-accent-soft hover:text-ink">
              Atzīmēt visas
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg px-2 py-1 text-muted hover:bg-accent-soft hover:text-ink">
              Notīrīt
            </button>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {modules.map((m) => {
            const ids = m.topics.map((t) => t.id);
            const n = ids.filter((id) => selected.has(id)).length;
            const all = n === ids.length && n > 0;
            return (
              <li key={m.id} className={`rounded-2xl border border-line bg-white ${m.locked ? "opacity-60" : ""}`}>
                <label className={`flex min-h-14 items-center gap-3 px-4 ${m.locked ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    disabled={m.locked}
                    checked={all}
                    ref={(el) => {
                      if (el) el.indeterminate = n > 0 && !all;
                    }}
                    onChange={(e) => toggle(ids, e.target.checked)}
                    className="size-5 shrink-0 accent-accent"
                  />
                  <span className="min-w-0 flex-1 font-semibold">
                    <span className="tabular-nums text-accent">{String(m.order).padStart(2, "0")}</span> {m.title}
                  </span>
                  {m.locked ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                      <Lock aria-hidden="true" className="size-3.5" /> Pilnajā piekļuvē
                    </span>
                  ) : (
                    <span className="shrink-0 text-sm tabular-nums text-muted">{m.topics.reduce((s, t) => s + t.questions, 0)}</span>
                  )}
                </label>
                {!m.locked && (
                  <ul className="border-t border-line px-4 py-2">
                    {m.topics.map((t) => (
                      <li key={t.id}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1 pl-8 text-[15px]">
                          <input
                            type="checkbox"
                            checked={selected.has(t.id)}
                            onChange={(e) => toggle([t.id], e.target.checked)}
                            className="size-4 shrink-0 accent-accent"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="tabular-nums text-muted">{t.id}</span> {t.title}
                          </span>
                          {t.mistakes > 0 && <span className="shrink-0 rounded-full bg-err-soft px-2 py-0.5 text-xs font-semibold text-err">{plural(t.mistakes, "kļūda", "kļūdas")}</span>}
                          <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted">{t.questions}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-xl font-semibold">Iestatījumi</h2>

          <label className={`mt-4 flex items-start gap-3 ${anyMistakes || mistakesOnly ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
            <input
              type="checkbox"
              checked={mistakesOnly}
              disabled={!anyMistakes && !mistakesOnly}
              onChange={(e) => setMistakesOnly(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-accent"
            />
            <span>
              <span className="block font-semibold">Tikai jautājumi, kuros kļūdos</span>
              <span className="mt-0.5 block text-sm text-muted">Biežāk kļūdainie — vispirms.</span>
            </span>
          </label>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Jautājumu skaits</legend>
            <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-surface p-1">
              {COUNTS.map((c) => (
                <label key={c.value} className="cursor-pointer">
                  <input type="radio" name="skaits" value={c.value} checked={limit === c.value} onChange={() => setLimit(c.value)} className="peer sr-only" />
                  <span className="flex min-h-10 items-center justify-center rounded-lg text-sm text-muted peer-checked:bg-white peer-checked:font-semibold peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-accent">
                    {c.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <button type="button" disabled={total === 0} onClick={start} className="btn-primary mt-6 hidden w-full disabled:cursor-not-allowed disabled:opacity-40 lg:flex">
            {total > 0 ? `Sākt treniņu · ${total} jaut.` : "Sākt treniņu"}
          </button>
          <p className="mt-2 hidden text-center text-xs text-muted lg:block">
            {chosen.length === 0 ? "Izvēlies vismaz vienu tēmu." : mistakesOnly && pool === 0 ? "Izvēlētajās tēmās kļūdu nav." : `Izvēlētas ${chosen.length} tēmas`}
          </p>
        </div>
      </div>

      {/* telefonā — poga piestiprināta ekrāna apakšā */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <button type="button" disabled={total === 0} onClick={start} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40">
          {total > 0 ? `Sākt treniņu · ${total} jaut.` : "Sākt treniņu"}
        </button>
      </div>
    </div>
  );
}
