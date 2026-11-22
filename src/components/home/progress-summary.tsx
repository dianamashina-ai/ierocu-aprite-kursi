import Link from "next/link";
import { ArrowUpRight, Check, X } from "lucide-react";
import { READY_LAST_EXAMS } from "@/lib/progress/readiness";
import type { getDashboard } from "@/lib/progress/service";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/**
 * Pieslēgtiem lietotājiem: kopējais progress (apgūto jautājumu daļa, kā moduļu kartītēs)
 * un maza kartīte ar pēdējiem 3 izmēģinājuma eksāmeniem.
 */
export function ProgressSummary({ d }: { d: Dashboard }) {
  const pct = d.totalQuestions ? Math.round((d.masteredQuestions / d.totalQuestions) * 100) : 0;
  const ready = d.readiness.ready;
  // pēdējie 3 mēģinājumi: vecākais pa kreisi, jaunākais pa labi
  const last = d.exams.slice(0, READY_LAST_EXAMS).reverse();
  const slots = Array.from({ length: READY_LAST_EXAMS }, (_, i) => last[i] ?? null);

  return (
    <section aria-labelledby="progress-h" className="mt-10 grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <h2 id="progress-h" className="sr-only">Tavs progress</h2>

      <div className={`rounded-2xl border bg-white p-5 sm:p-6 ${ready ? "border-ok" : "border-line"}`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{ready ? "Gatavs eksāmenam" : "Tavs progress"}</p>
            <p className="mt-1 text-5xl font-bold leading-none tracking-tight tabular-nums">{pct}%</p>
          </div>
          <p className="text-sm tabular-nums text-muted">
            {d.masteredQuestions} no {d.totalQuestions} jautājumiem apgūti
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Tavs progress"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-4 h-2 overflow-hidden rounded-full bg-accent-soft"
        >
          <div className={`h-full rounded-full ${ready ? "bg-ok" : "bg-accent"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="relative flex flex-col rounded-2xl border border-line bg-white p-5 transition-colors hover:border-ink sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted">
            <Link href="/eksamens" className="after:absolute after:inset-0 after:rounded-2xl">
              Izmēģinājuma eksāmeni
            </Link>
          </p>
          <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
        </div>
        <ol aria-label="Pēdējie 3 mēģinājumi" className="mt-3 flex gap-2">
          {slots.map((e, i) => (
            <li
              key={i}
              className={`flex size-9 items-center justify-center rounded-full ${!e ? "border border-dashed border-line" : e.passed ? "bg-ok text-white" : "bg-err text-white"}`}
            >
              {!e ? (
                <span className="sr-only">Vēl nav kārtots</span>
              ) : e.passed ? (
                <>
                  <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                  <span className="sr-only">Nokārtots</span>
                </>
              ) : (
                <>
                  <X aria-hidden="true" className="size-4" strokeWidth={3} />
                  <span className="sr-only">Nav nokārtots</span>
                </>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-auto pt-3 text-xs text-muted">Nokārto 3 pēc kārtas — tad būsi gatavs eksāmenam.</p>
      </div>
    </section>
  );
}
