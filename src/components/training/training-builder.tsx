"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/format";
import { ACTION_CARD_CLASS } from "@/components/page-header";
import { ModulePicker } from "@/components/training/module-picker";

export interface BuilderModule {
  id: string;
  order: number;
  title: string;
  locked: boolean;
  questions: number;
  mistakes: number;
}

const COUNTS = [
  { value: 20, label: "20" },
  { value: 40, label: "40" },
  { value: 60, label: "60" },
  { value: 80, label: "80" },
] as const;

/** Treniņa izvēle: moduļi (izkrītošs saraksts), “tikai kļūdas”, jautājumu skaits → /trenins/sakt?… */
export function TrainingBuilder({ modules }: { modules: BuilderModule[] }) {
  const router = useRouter();
  const available = modules.filter((m) => !m.locked);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(available.map((m) => m.id)));
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [limit, setLimit] = useState<number>(20);

  const chosen = available.filter((m) => selected.has(m.id));
  const totalMistakes = chosen.reduce((s, m) => s + m.mistakes, 0);
  const pool = chosen.reduce((s, m) => s + (mistakesOnly ? m.mistakes : m.questions), 0);
  const total = limit > 0 ? Math.min(limit, pool) : pool;
  const hasLocked = available.length < modules.length;
  // “Visi moduļi” — tikai ja visi kursa moduļi pieejami un izvēlēti
  const allChosen = !hasLocked && chosen.length === available.length && available.length > 0;

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
      <ModulePicker modules={modules} selected={selected} onChange={setSelected} />

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
        Sākt treniņu
      </button>
    </div>
  );
}
