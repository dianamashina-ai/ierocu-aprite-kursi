import Link from "next/link";
import { ArrowUpRight, ChevronDown, Lock } from "lucide-react";
import { MODULE_META } from "@/config/module-meta";

interface OutlineModule {
  id: string;
  order: number;
  titleLv: string;
  questionCount: number;
  topics: { id: string; titleLv: string; minutes: number | null; questionCount: number }[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Sākumlapas programma viesiem: moduļi akordeonā ar aprakstu un tēmām. */
export function CourseOutline({ modules, totals }: { modules: OutlineModule[]; totals: { modules: number; topics: number } }) {
  return (
    <section id="programma" aria-labelledby="programma-h" className="scroll-mt-6 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-24">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <h2 id="programma-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">Ko mācīsies</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Kursā ir {totals.modules} moduļi un {totals.topics} tēmas — no ieroča uzbūves līdz atbildībai. Sāc ar pamatiem un zināšanas
            papildini pakāpeniski.
          </p>
          <p className="mt-6 font-semibold">1. modulis ir bez maksas.</p>
          <p className="mt-1 text-muted">Moduļi 2–{totals.modules}, skaidrojumi un eksāmena simulācija ir pieejami pilnajā kursā.</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/modulis/M1" className="btn-secondary gap-2">
              Izmēģināt 1. moduli <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/iegadaties" className="inline-flex min-h-11 items-center font-semibold hover:text-accent">
              Iegādāties pilnu piekļuvi
            </Link>
          </div>
        </div>

        <ol className="border-t border-line">
          {modules.map((m) => (
            <li key={m.id} className="border-b border-line">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-5 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="w-9 shrink-0 text-2xl leading-none font-bold tabular-nums text-accent">{pad(m.order)}</span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <span className="text-lg font-semibold leading-snug group-hover:text-accent">{m.titleLv}</span>
                    {m.order === 1 && (
                      <span className="whitespace-nowrap rounded-full bg-ok px-2.5 py-0.5 text-xs font-semibold text-white">
                        Bez maksas
                      </span>
                    )}
                  </span>
                  <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="pb-7 sm:pl-14">
                  <p className="text-[15px] leading-relaxed text-muted">{MODULE_META[m.id]?.description}</p>
                  <ul className="mt-4 space-y-2">
                    {m.topics.map((t) => (
                      <li key={t.id} className="flex items-baseline gap-3 text-[15px]">
                        <span className="w-8 shrink-0 tabular-nums text-muted">{t.id}</span>
                        <span className="min-w-0 flex-1">{t.titleLv}</span>
                        <span className="shrink-0 text-sm tabular-nums text-muted">
                          {t.minutes ? `${t.minutes} min · ` : ""}
                          {t.questionCount} jaut.
                        </span>
                      </li>
                    ))}
                  </ul>
                  {m.order === 1 ? (
                    <Link href={`/modulis/${m.id}`} className="mt-5 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold hover:text-accent">
                      Atvērt moduli <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  ) : (
                    <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted">
                      <Lock aria-hidden="true" className="size-3.5" /> Pieejams pilnajā kursā
                    </p>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
