import Link from "next/link";
import { Check } from "lucide-react";
import { READY_LAST_EXAMS, READY_TOPIC_PERCENT } from "@/lib/progress/readiness";
import type { getDashboard } from "@/lib/progress/service";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/** Viens solis ceļā uz eksāmenu: numurs/ķeksītis, nosaukums, paskaidrojums, josla un skaitītājs. */
function Step({
  n,
  done,
  title,
  hint,
  value,
  total,
  unit,
  href,
  action,
  children,
}: {
  n: number;
  done: boolean;
  title: string;
  hint: string;
  value: number;
  total: number;
  unit: string;
  href: string;
  action: string;
  children?: React.ReactNode;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <li className="flex gap-4 py-5 first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-ok text-white" : "bg-accent-soft text-accent-strong"}`}
      >
        {done ? <Check className="size-4" strokeWidth={3} /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-semibold">
            {title}
            {done && <span className="sr-only"> — izpildīts</span>}
          </h3>
          <p className="text-sm tabular-nums">
            <span className="font-semibold">{value}</span> <span className="text-muted">no {total} {unit}</span>
          </p>
        </div>
        <p className="mt-0.5 text-sm text-muted">{hint}</p>
        {children ?? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
            <div className={`h-full rounded-full ${done ? "bg-ok" : "bg-accent"}`} style={{ width: `${pct}%` }} />
          </div>
        )}
        {!done && (
          <Link href={href} className="mt-3 inline-block text-sm font-semibold text-accent-strong hover:underline">
            {action} →
          </Link>
        )}
      </div>
    </li>
  );
}

/** Progresa bloks (pieslēgtiem lietotājiem): divi soļi līdz gatavībai eksāmenam. */
export function ProgressSummary({ d, totalTopics }: { d: Dashboard; totalTopics: number }) {
  const topicsDone = d.modules.flatMap((m) => m.topics).filter((t) => t.percent >= READY_TOPIC_PERCENT).length;
  // pēc kārtas nokārtotie eksāmeni (no jaunākā), ne vairāk par 3
  let streak = 0;
  for (const e of d.exams) {
    if (!e.passed) break;
    streak++;
  }
  streak = Math.min(streak, READY_LAST_EXAMS);
  const topicsOk = topicsDone === totalTopics && totalTopics > 0;
  const examsOk = streak === READY_LAST_EXAMS;
  const doneSteps = Number(topicsOk) + Number(examsOk);
  const ready = d.readiness.ready;

  return (
    <section aria-labelledby="progress-h" className={`mt-10 rounded-2xl border bg-white p-5 sm:p-6 ${ready ? "border-ok" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="progress-h" className="text-xl font-semibold tracking-tight">
          {ready ? "Tu esi gatavs eksāmenam" : "Ceļš līdz eksāmenam"}
        </h2>
        <p className="text-sm text-muted">
          {ready ? "Abi soļi izpildīti — vari pieteikties eksāmenam." : `Izpildīti ${doneSteps} no 2 soļiem`}
        </p>
      </div>

      <ol className="mt-5 divide-y divide-line">
        <Step
          n={1}
          done={topicsOk}
          title="Apgūsti visas tēmas"
          hint={`Tēma apgūta, kad pareizi atbildēts uz ${READY_TOPIC_PERCENT} % tās jautājumu. Kopā pareizi atbildēti ${d.masteredQuestions} no ${d.totalQuestions} jautājumiem.`}
          value={topicsDone}
          total={totalTopics}
          unit="tēmām"
          href={d.answeredQuestions === 0 ? "/modulis/M1" : d.mistakes > 0 ? "/trenins/sakt?kludas=1" : "/trenins"}
          action={d.answeredQuestions === 0 ? "Sākt mācīties" : d.mistakes > 0 ? `Labot kļūdas (${d.mistakes})` : "Trenēties"}
        />
        <Step
          n={2}
          done={examsOk}
          title="Nokārto 3 izmēģinājuma eksāmenus pēc kārtas"
          hint="Tāpat kā īstajā eksāmenā. Ja kāds netiek nokārtots, skaitīšana sākas no jauna."
          value={streak}
          total={READY_LAST_EXAMS}
          unit="pēc kārtas"
          href="/eksamens"
          action="Kārtot izmēģinājuma eksāmenu"
        >
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: READY_LAST_EXAMS }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < streak ? (examsOk ? "bg-ok" : "bg-accent") : "bg-accent-soft"}`} />
            ))}
          </div>
        </Step>
      </ol>
    </section>
  );
}
