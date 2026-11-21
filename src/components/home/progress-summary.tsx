import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { topicSlug } from "@/lib/content/queries";
import { READY_TOPIC_PERCENT } from "@/lib/progress/readiness";
import type { getDashboard } from "@/lib/progress/service";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

const tile = "relative flex flex-col rounded-2xl border border-line bg-white p-4 sm:p-5";
const WEEKDAYS = ["Sv", "P", "O", "T", "C", "Pk", "S"];

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
      <p className="mt-3 text-3xl font-bold leading-none tabular-nums">{value}</p>
      {children && <div className="mt-auto pt-3">{children}</div>}
    </div>
  );
}

/** Kompakts progresa bloks “Mācību kurss” lapas augšā (pieslēgtiem lietotājiem). */
export function ProgressSummary({ d, totalTopics }: { d: Dashboard; totalTopics: number }) {
  const topics = d.modules.flatMap((m) => m.topics);
  const topicsDone = topics.filter((t) => t.percent >= READY_TOPIC_PERCENT).length;
  const topicsPct = totalTopics ? Math.round((topicsDone / totalTopics) * 100) : 0;
  const masteredPct = d.totalQuestions ? Math.round((d.masteredQuestions / d.totalQuestions) * 100) : 0;
  const lastExams = d.exams.slice(0, 3);
  const started = d.answeredQuestions > 0;
  const ready = d.readiness.ready;

  const next =
    !started
      ? { href: "/modulis/M1", label: "Sākt ar 1. moduli" }
      : d.dueReviews > 0
        ? { href: "/kludas", label: `Atkārtot kļūdas (${d.dueReviews})` }
        : { href: "/eksamens", label: "Izmēģinājuma eksāmens" };

  return (
    <section aria-labelledby="progress-h" className="mt-10">
      <h2 id="progress-h" className="sr-only">Tavs progress</h2>
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,3fr)_minmax(0,3fr)]">
        {/* Galvenā kartīte: apgūtās tēmas — katra tēma ir viens punkts */}
        <div className={`${tile} lg:row-span-2 ${ready ? "border-ok" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted">{ready ? "Gatavs eksāmenam" : "Tēmas apgūtas"}</p>
            <p className="text-sm font-semibold tabular-nums">
              {topicsDone} no {totalTopics}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-6xl font-bold leading-none tracking-tight tabular-nums sm:text-7xl">{topicsPct}%</p>
            <ul aria-label={`Apgūtas ${topicsDone} no ${totalTopics} tēmām`} className="grid w-full grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5 sm:w-[60%] sm:max-w-80">
              {topics.map((t) => (
                <li
                  key={t.id}
                  title={`${t.id} ${t.title}: ${t.percent} %`}
                  className={`aspect-square w-full max-w-4 rounded-full ${
                    t.percent >= READY_TOPIC_PERCENT ? "bg-accent" : t.answered > 0 ? "bg-accent/25" : "bg-accent-soft"
                  }`}
                />
              ))}
            </ul>
          </div>
          <p className="mt-4 text-xs text-muted">Tēma skaitās apgūta, ja pareizi atbildēts uz {READY_TOPIC_PERCENT} % tās jautājumu.</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
            <Link href={next.href} className="btn-primary">
              {next.label}
            </Link>
            {d.weakTopics.length > 0 && (
              <p className="text-sm text-muted">
                Vājākā tēma:{" "}
                <Link href={`/tema/${topicSlug(d.weakTopics[0].id)}/trenins`} className="font-semibold text-ink underline underline-offset-4">
                  {d.weakTopics[0].id} {d.weakTopics[0].title}
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:contents">
          <Tile label="Izmēģinājuma eksāmeni" href="/eksamens" value={`${d.readiness.examsPassed}/3`}>
            <div className="flex items-center gap-1.5" aria-label="Pēdējie 3 eksāmeni">
              {[0, 1, 2].map((i) => {
                const e = lastExams[i];
                return <span key={i} className={`size-3.5 rounded-full ${!e ? "bg-accent-soft" : e.passed ? "bg-ok" : "bg-err"}`} />;
              })}
              <span className="ml-1 text-xs text-muted">pēdējie 3</span>
            </div>
          </Tile>

          <Tile label="Kļūdas" href="/kludas" value={d.dueReviews}>
            <p className="text-xs text-muted">{d.dueReviews > 0 ? "jāatkārto šodien" : "šodien nekas nav jāatkārto"}</p>
          </Tile>

          <Tile label="Sērija" value={`${d.streak} d.`}>
            <div className="flex items-end gap-1" aria-label="Pēdējās 7 dienas">
              {d.week.map((w) => (
                <span key={w.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className={`w-full rounded-full ${w.active ? "h-5 bg-accent" : "h-2 bg-accent-soft"}`} />
                  <span className="text-[10px] leading-none text-muted">{WEEKDAYS[new Date(`${w.day}T12:00:00Z`).getUTCDay()]}</span>
                </span>
              ))}
            </div>
          </Tile>

          <Tile label="Jautājumi" value={`${masteredPct}%`}>
            <p className="text-xs text-muted">
              apgūti · {d.unanswered} vēl nav atbildēti
            </p>
          </Tile>
        </div>
      </div>
    </section>
  );
}
