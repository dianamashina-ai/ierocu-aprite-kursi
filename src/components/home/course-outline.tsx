import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, Lock, Monitor, Smartphone } from "lucide-react";
import { MODULE_META } from "@/config/module-meta";

interface OutlineModule {
  id: string;
  order: number;
  titleLv: string;
  questionCount: number;
  topics: {
    id: string;
    titleLv: string;
    minutes: number | null;
    questionCount: number;
  }[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Sākumlapas programma viesiem: moduļi akordeonā ar aprakstu un tēmām. */
export function CourseOutline({
  modules,
  totals,
}: {
  modules: OutlineModule[];
  totals: { modules: number; topics: number };
}) {
  return (
    <section
      id="programma"
      aria-labelledby="programma-h"
      className="scroll-mt-6 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <h2
              id="programma-h"
              className="text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              Ko mācīsies
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Kursā ir {totals.modules} moduļi un {totals.topics} tēmas — no
              ieroča uzbūves līdz atbildībai. Sāc ar pamatiem un zināšanas
              papildini pakāpeniski.
            </p>
            <div className="mt-8 flex items-start gap-4 rounded-2xl bg-surface p-5">
              <span aria-hidden="true" className="flex shrink-0 items-end gap-1 text-accent-strong">
                <Monitor className="size-7" strokeWidth={1.75} />
                <Smartphone className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-semibold">Mācies, kur ērti</p>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">
                  Datorā mājās vai telefonā ceļā — kad vien ir brīvs brīdis. Nodarbības ir īsas, tāpēc vari mācīties pa daļām savā tempā.
                </p>
              </div>
            </div>
          </div>

          <ol className="border-t border-line">
            {modules.map((m) => (
              <li key={m.id} className="border-b border-line">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-5 py-6 [&::-webkit-details-marker]:hidden">
                    <span className="w-9 shrink-0 text-2xl leading-none font-bold tabular-nums text-accent">
                      {pad(m.order)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <span className="text-lg font-semibold leading-snug group-hover:text-accent">
                        {m.titleLv}
                      </span>
                      {m.order === 1 && (
                        <span className="whitespace-nowrap rounded-full bg-ok px-2.5 py-0.5 text-xs font-semibold text-white">
                          Bez maksas
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="pb-7 sm:pl-14">
                    <p className="text-[15px] leading-relaxed text-muted">
                      {MODULE_META[m.id]?.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {m.topics.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-baseline gap-3 text-[15px]"
                        >
                          <span className="w-8 shrink-0 tabular-nums text-muted">
                            {t.id}
                          </span>
                          <span className="min-w-0 flex-1">{t.titleLv}</span>
                          <span className="shrink-0 text-sm tabular-nums text-muted">
                            {t.minutes ? `${t.minutes} min · ` : ""}
                            {t.questionCount} jaut.
                          </span>
                        </li>
                      ))}
                    </ul>
                    {m.order === 1 ? (
                      <Link
                        href="/registreties"
                        className="mt-5 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold hover:text-accent"
                      >
                        Sākt bez maksas{" "}
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                      </Link>
                    ) : (
                      <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted">
                        <Lock aria-hidden="true" className="size-3.5" />{" "}
                        Pieejams pilnajā kursā
                      </p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 flex flex-col gap-6 rounded-2xl bg-ink p-6 text-white sm:p-8 lg:mt-16 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-2xl font-semibold tracking-tight">
              Izmēģini, pirms pērc
            </p>
            <p className="mt-2 max-w-xl text-white/70">
              Pirmais modulis ir pieejams bez maksas: izveido kontu un sāc mācīties jau šodien. Pārējie {totals.modules - 1}{" "}
              moduļi un eksāmena simulācija ir pilnajā kursā.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/registreties"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-semibold text-ink transition-colors hover:bg-white/90"
            >
              Sākt bez maksas{" "}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/iegadaties"
              className="inline-flex min-h-12 items-center gap-2 font-semibold text-white/90 hover:text-white"
            >
              Iegādāties pilnu kursu{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
