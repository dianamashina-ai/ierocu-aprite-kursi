import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { READY_TOPIC_PERCENT } from "@/lib/progress/readiness";
import type { getDashboard } from "@/lib/progress/service";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

const tile = "relative flex flex-col rounded-2xl border border-line bg-white p-4 sm:p-5";

/** Maza kartīte: virsraksts (+ bultiņa, ja saite), liels skaitlis, vizualizācija vai paskaidrojums. */
function Tile({ label, href, value, children }: { label: string; href?: string; value: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className={`${tile} ${href ? "transition-colors hover:border-ink" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl">
              {label}
            </Link>
          ) : (
            label
          )}
        </p>
        {href && <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted" />}
      </div>
      <p className="mt-3 text-4xl font-bold leading-none tabular-nums">{value}</p>
      {children && <div className="mt-auto pt-4">{children}</div>}
    </div>
  );
}

/** Kompakts progresa bloks (pieslēgtiem lietotājiem): kurss kopā, jautājumi, izmēģinājuma eksāmeni. */
export function ProgressSummary({ d, totalTopics }: { d: Dashboard; totalTopics: number }) {
  const topics = d.modules.flatMap((m) => m.topics);
  const topicsDone = topics.filter((t) => t.percent >= READY_TOPIC_PERCENT).length;
  const topicsPct = totalTopics ? Math.round((topicsDone / totalTopics) * 100) : 0;
  const masteredPct = d.totalQuestions ? Math.round((d.masteredQuestions / d.totalQuestions) * 100) : 0;
  const lastExams = d.exams.slice(0, 3);
  const started = d.answeredQuestions > 0;
  const ready = d.readiness.ready;

  const next = !started
    ? { href: "/modulis/M1", label: "Sākt ar 1. moduli" }
    : d.mistakes > 0
      ? { href: "/trenins/sakt?kludas=1", label: `Labot kļūdas (${d.mistakes})` }
      : { href: "/eksamens", label: "Izmēģinājuma eksāmens" };

  return (
    <section aria-labelledby="progress-h" className="mt-10">
      <h2 id="progress-h" className="sr-only">Tavs progress</h2>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Kurss kopā — katra tēma ir viens punkts */}
        <div className={`${tile} ${ready ? "border-ok" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted">{ready ? "Gatavs eksāmenam" : "Kursa progress"}</p>
            <p className="text-sm tabular-nums text-muted">
              <span className="font-semibold text-ink">{topicsDone}</span> no {totalTopics} tēmām
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-5xl font-bold leading-none tracking-tight tabular-nums">{topicsPct}%</p>
            <ul aria-label={`Apgūtas ${topicsDone} no ${totalTopics} tēmām`} className="grid w-full grid-cols-[repeat(19,minmax(0,1fr))] gap-1 sm:w-[62%]">
              {topics.map((t) => (
                <li
                  key={t.id}
                  title={`${t.id} ${t.title}: ${t.percent} %`}
                  className={`aspect-square w-full max-w-3.5 rounded-full ${
                    t.percent >= READY_TOPIC_PERCENT ? "bg-accent" : t.answered > 0 ? "bg-accent/25" : "bg-accent-soft"
                  }`}
                />
              ))}
            </ul>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-5">
            <Link href={next.href} className="btn-primary">
              {next.label}
            </Link>
            <p className="text-xs text-muted">Tēma apgūta, ja pareizi atbildēts uz {READY_TOPIC_PERCENT} % jautājumu.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:contents">
          <Tile label="Jautājumi apgūti" value={`${masteredPct}%`}>
            <div className="h-1.5 overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${masteredPct}%` }} />
            </div>
            <p className="mt-2 text-xs tabular-nums text-muted">
              {d.masteredQuestions} no {d.totalQuestions}
            </p>
          </Tile>

          <Tile label="Izmēģinājuma eksāmeni" href="/eksamens" value={`${d.readiness.examsPassed}/3`}>
            <div className="flex items-center gap-1.5" aria-label="Pēdējie 3 eksāmeni">
              {[0, 1, 2].map((i) => {
                const e = lastExams[i];
                return <span key={i} className={`size-3.5 rounded-full ${!e ? "bg-accent-soft" : e.passed ? "bg-ok" : "bg-err"}`} />;
              })}
              <span className="ml-1 text-xs text-muted">pēdējie 3</span>
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}
