"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { plural } from "@/lib/format";

export interface PickerModule {
  id: string;
  order: number;
  title: string;
  /** slēgts — redzams, bet nav izvēlams */
  locked?: boolean;
  mistakes?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Vienots moduļu izkrītošais saraksts ar izvēles rūtiņām (Treniņš, Jautājumi). */
export function ModulePicker({
  modules,
  selected,
  onChange,
  id = "moduli",
}: {
  modules: PickerModule[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const available = modules.filter((m) => !m.locked);
  const hasLocked = available.length < modules.length;
  const chosen = available.filter((m) => selected.has(m.id));
  // “Visi moduļi” — tikai ja visi kursa moduļi pieejami un izvēlēti
  const allChosen = !hasLocked && chosen.length === available.length && available.length > 0;
  const summary =
    chosen.length === 0
      ? "Izvēlies moduļus"
      : allChosen
        ? "Visi moduļi"
        : chosen.length === 1
          ? `${pad(chosen[0].order)} ${chosen[0].title}`
          : `${chosen.length} moduļi`;

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

  const toggle = (mid: string) => {
    const next = new Set(selected);
    if (next.has(mid)) next.delete(mid);
    else next.add(mid);
    onChange(next);
  };

  return (
    <div ref={boxRef} className="relative">
      <p id={`${id}-l`} className="sr-only">Moduļi</p>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-l ${id}-v`}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 text-left text-base"
      >
        <span id={`${id}-v`} className="truncate">{summary}</span>
        <ChevronDown aria-hidden="true" className={`size-5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(34,34,34,0.25)]">
          {!hasLocked && (
            <>
              <button
                type="button"
                onClick={() => onChange(allChosen ? new Set() : new Set(available.map((m) => m.id)))}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left font-semibold hover:bg-surface"
              >
                <Box on={allChosen} />
                Visi moduļi
              </button>
              <div className="my-1 h-px bg-line" />
            </>
          )}
          <ul role="listbox" aria-multiselectable="true" aria-label="Moduļi">
            {modules.map((m) => (
              <li key={m.id} role="option" aria-selected={selected.has(m.id)} aria-disabled={m.locked}>
                <button
                  type="button"
                  disabled={m.locked}
                  onClick={() => toggle(m.id)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Box on={selected.has(m.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="tabular-nums text-muted">{pad(m.order)}</span> {m.title}
                  </span>
                  {m.locked ? (
                    <Lock aria-label="Pilnajā piekļuvē" className="size-4 shrink-0 text-muted" />
                  ) : (
                    (m.mistakes ?? 0) > 0 && (
                      <span className="shrink-0 text-xs font-semibold text-err">{plural(m.mistakes ?? 0, "kļūda", "kļūdas")}</span>
                    )
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
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
