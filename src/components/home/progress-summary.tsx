import Link from "next/link";
import { ArrowUpRight, Check, X } from "lucide-react";
import { READY_LAST_EXAMS } from "@/lib/progress/readiness";
import { FREE_MODULE_IDS } from "@/config/exam";
import type { getDashboard } from "@/lib/progress/service";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/**
 * Pieslēgtiem lietotājiem: kopējais progress (apgūto jautājumu daļa, kā moduļu kartītēs)
 * un maza kartīte ar pēdējiem READY_LAST_EXAMS izmēģinājuma eksāmeniem.
 */
export function ProgressSummary({
  d,
  freeOnly = false,
}: {
  d: Dashboard;
  freeOnly?: boolean;
}) {
  // bez pilnas piekļuves — progress tikai bezmaksas modulī
  const free = d.modules.filter((m) =>
    (FREE_MODULE_IDS as readonly string[]).includes(m.id),
  );
  const mastered = freeOnly
    ? free.reduce((s, m) => s + m.mastered, 0)
    : d.masteredQuestions;
  const total = freeOnly
    ? free.reduce((s, m) => s + m.total, 0)
    : d.totalQuestions;
  const pct = total ? Math.round((mastered / total) * 100) : 0;
  const label = freeOnly ? "1. moduļa progress" : "Tavs progress";
  // kartīte parādās, kad pirmo reizi sasniegti 70 % (EXAMS_UNLOCK_PERCENT), un paliek
  const showExams = !freeOnly && d.examsUnlocked;
  const ready = !freeOnly && d.readiness.ready;
  // pēdējie mēģinājumi: vecākais pa kreisi, jaunākais pa labi
  const last = d.exams.slice(0, READY_LAST_EXAMS).reverse();
  const slots = Array.from(
    { length: READY_LAST_EXAMS },
    (_, i) => last[i] ?? null,
  );

  return (
    <section
      aria-labelledby="progress-h"
      className={`mt-10 grid gap-3 sm:gap-4 ${showExams ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}
    >
      <h2 id="progress-h" className="sr-only">
        Tavs progress
      </h2>

      <div
        className={`rounded-2xl border bg-white p-5 sm:p-6 ${ready ? "border-ok" : "border-line"}`}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">
              {ready ? "Gatavs eksāmenam" : label}
            </p>
            <p className="mt-1 text-5xl font-bold leading-none tracking-tight tabular-nums">
              {pct}%
            </p>
          </div>
          <p className="text-sm tabular-nums text-muted">
            {mastered} no {total} jautājumiem apgūti
          </p>
        </div>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-4 h-2 overflow-hidden rounded-full bg-accent-soft"
        >
          <div
            className={`h-full rounded-full ${ready ? "bg-ok" : "bg-accent"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {showExams && (
        <ExamAttemptsCard
          results={slots.map((e) => (e ? Boolean(e.passed) : null))}
        />
      )}
    </section>
  );
}

/** Pēdējie READY_LAST_EXAMS izmēģinājuma eksāmeni: true — nokārtots, false — nav, null — vēl nav kārtots (vecākais pa kreisi). */
export function ExamAttemptsCard({ results }: { results: (boolean | null)[] }) {
  const allPassed = results.length > 0 && results.every((r) => r === true);

  // Tukšs stāvoklis: vēl neviena mēģinājuma — aicinājums un poga
  if (results.every((r) => r === null))
    return (
      <div className="flex flex-col rounded-2xl border border-line bg-white p-5 sm:p-6">
        <p className="text-sm text-muted">Izmēģinājuma eksāmeni</p>
        <p className="mt-2 font-semibold">Laiks pārbaudīt sevi</p>
        <p className="mt-1 text-sm text-muted">
          Nokārto {READY_LAST_EXAMS} izmēģinājuma eksāmenus pēc kārtas — un būsi
          gatavs īstajam.
        </p>
        <Link href="/eksamens" className="btn-primary mt-4 self-start">
          Sākt eksāmenu
        </Link>
      </div>
    );

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-5 transition-colors hover:border-ink sm:p-6 ${allPassed ? "border-ok" : "border-line"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">
          <Link
            href="/eksamens"
            className="after:absolute after:inset-0 after:rounded-2xl"
          >
            Izmēģinājuma eksāmeni
          </Link>
        </p>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted"
        />
      </div>
      <ol
        aria-label={`Pēdējie ${READY_LAST_EXAMS} mēģinājumi`}
        className="mt-3 flex gap-1.5"
      >
        {results.map((e, i) => (
          <li
            key={i}
            className={`flex size-8 items-center justify-center rounded-full ${e === null ? "border border-dashed border-line" : e ? "bg-ok text-white" : "bg-accent-soft text-muted"}`}
          >
            {e === null ? (
              <span className="sr-only">Vēl nav kārtots</span>
            ) : e ? (
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
      <p
        className={`mt-auto pt-3 text-xs ${allPassed ? "font-semibold text-ok" : "text-muted"}`}
      >
        {allPassed
          ? `${READY_LAST_EXAMS} pēc kārtas nokārtoti — tu esi gatavs!`
          : `Nokārto ${READY_LAST_EXAMS} pēc kārtas — tad būsi gatavs eksāmenam.`}
      </p>
    </div>
  );
}
