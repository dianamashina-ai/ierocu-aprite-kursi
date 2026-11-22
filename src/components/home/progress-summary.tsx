import { READY_TOPIC_PERCENT } from "@/lib/progress/readiness";
import type { getDashboard } from "@/lib/progress/service";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/** Kopējais progress (pieslēgtiem lietotājiem): procenti un josla pēc apgūtajām tēmām. */
export function ProgressSummary({ d, totalTopics }: { d: Dashboard; totalTopics: number }) {
  const topicsDone = d.modules.flatMap((m) => m.topics).filter((t) => t.percent >= READY_TOPIC_PERCENT).length;
  const pct = totalTopics ? Math.round((topicsDone / totalTopics) * 100) : 0;
  const ready = d.readiness.ready;

  return (
    <section aria-labelledby="progress-h" className={`mt-10 rounded-2xl border bg-white p-5 sm:p-6 ${ready ? "border-ok" : "border-line"}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="progress-h" className="text-sm text-muted">
            {ready ? "Gatavs eksāmenam" : "Tavs progress"}
          </h2>
          <p className="mt-1 text-5xl font-bold leading-none tracking-tight tabular-nums">{pct}%</p>
        </div>
        <p className="text-sm tabular-nums text-muted">
          {topicsDone} no {totalTopics} tēmām apgūtas
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
    </section>
  );
}
