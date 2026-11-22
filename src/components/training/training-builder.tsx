"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Lock } from "lucide-react";
import { plural } from "@/lib/format";
import { ACTION_CARD_CLASS } from "@/components/page-header";

export interface BuilderModule {
  id: string;
  order: number;
  title: string;
  locked: boolean;
  questions: number;
  mistakes: number;
}

const COUNTS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 40, label: "40" },
  { value: 0, label: "Visi" },
] as const;

/** Treniņa izvēle: moduļi (izkrītošs saraksts), “tikai kļūdas”, jautājumu skaits → /trenins/sakt?… */
export function TrainingBuilder({ modules }: { modules: BuilderModule[] }) {
  const router = useRouter();
  const available = modules.filter((m) => !m.locked);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(available.map((m) => m.id)));
  const [open, setOpen] = useState(false);
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [limit, setLimit] = useState<number>(20);
  const boxRef = useRef<HTMLDivElement>(null);

  // aizver sarakstu, noklikšķinot ārpusē vai ar Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chosen = available.filter((m) => selected.has(m.id));
  const totalMistakes = chosen.reduce((s, m) => s + m.mistakes, 0);
  const pool = chosen.reduce((s, m) => s + (mistakesOnly ? m.mistakes : m.questions), 0);
  const total = limit > 0 ? Math.min(limit, pool) : pool;
  const allChosen = chosen.length === available.length && available.length > 0;
  const summary =
    chosen.length === 0 ? "Izvēlies moduļus" : allChosen ? "Visi moduļi" : chosen.length === 1 ? `${String(chosen[0].order).padStart(2, "0")} ${chosen[0].title}` : `${chosen.length} moduļi`;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const start = () => {
    const p = new URLSearchParams();
    if (!allChosen) p.set("moduli", chosen.map((m) => m.id).join(","));
    if (mistakesOnly) p.set("kludas", "1");
    if (limit > 0) p.set("skaits", String(limit));
    router.push(`/trenins/sakt${p.size ? `?${p}` : ""}`);
  };

  return (
    <div className={ACTION_CARD_CLASS}>
      {/* Moduļi */}
      <div ref={boxRef} className="relative">
        <p id="moduli-l" className="sr-only">Moduļi</p>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby="moduli-l moduli-v"
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 text-left text-base"
        >
          <span id="moduli-v" className="truncate">{summary}</span>
          <ChevronDown aria-hidden="true" className={`size-5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(34,34,34,0.25)]">
            <button
              type="button"
              onClick={() => setSelected(allChosen ? new Set() : new Set(available.map((m) => m.id)))}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left font-semibold hover:bg-surface"
            >
              <Box on={allChosen} />
              Visi moduļi
            </button>
            <div className="my-1 h-px bg-line" />
            <ul role="listbox" aria-multiselectable="true" aria-label="Moduļi">
              {modules.map((m) => (
                <li key={m.id} role="option" aria-selected={selected.has(m.id)} aria-disabled={m.locked}>
                  <button
                    type="button"
                    disabled={m.locked}
                    onClick={() => toggle(m.id)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <Box on={selected.has(m.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="tabular-nums text-muted">{String(m.order).padStart(2, "0")}</span> {m.title}
                    </span>
                    {m.locked ? (
                      <Lock aria-label="Pilnajā piekļuvē" className="size-4 shrink-0 text-muted" />
                    ) : (
                      m.mistakes > 0 && <span className="shrink-0 text-xs font-semibold text-err">{plural(m.mistakes, "kļūda", "kļūdas")}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tikai kļūdas */}
      <label className={`mt-5 flex items-start gap-3 ${totalMistakes > 0 || mistakesOnly ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
        <input
          type="checkbox"
          checked={mistakesOnly}
          disabled={totalMistakes === 0 && !mistakesOnly}
          onChange={(e) => setMistakesOnly(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-accent"
        />
        <span>
          <span className="block font-semibold">Tikai jautājumi, kuros kļūdos</span>
          <span className="mt-0.5 block text-sm text-muted">
            {totalMistakes > 0 ? `${plural(totalMistakes, "jautājums", "jautājumi")} · biežāk kļūdainie vispirms` : "Kļūdu pagaidām nav."}
          </span>
        </span>
      </label>

      {/* Skaits */}
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

      <button type="button" disabled={total === 0} onClick={start} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40">
        {total > 0 ? `Sākt treniņu · ${total} jaut.` : "Sākt treniņu"}
      </button>
    </div>
  );
}

function Box({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${on ? "border-accent bg-accent text-white" : "border-line bg-white"}`}>
      {on && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  );
}
