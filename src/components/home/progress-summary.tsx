import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { topicSlug } from "@/lib/content/queries";
import { plural } from "@/lib/format";
import { READY_TOPIC_PERCENT } from "@/lib/progress/readiness";
import type { getDashboard } from "@/lib/progress/service";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 text-sm text-muted">{label}</p>
    </div>
  );
}

function Check2({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ok" />
      ) : (
        <Circle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
      )}
      <span>{children}</span>
    </li>
  );
}

/** Kompakts progresa bloks “Mācību kurss” lapas augšā (pieslēgtiem lietotājiem). */
export function ProgressSummary({ d, totalTopics }: { d: Dashboard; totalTopics: number }) {
  const masteredPct = d.totalQuestions ? Math.round((d.masteredQuestions / d.totalQuestions) * 100) : 0;
  const topicsDone = totalTopics - d.readiness.topicsBelow.length;
  const ready = d.readiness.ready;

  return (
    <section
      aria-labelledby="progress-h"
      className={`mt-10 rounded-2xl border p-5 sm:p-6 ${ready ? "border-ok bg-ok-soft" : "border-line bg-white"}`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div>
          <h2 id="progress-h" className="font-semibold">
            {ready ? "Gatavs eksāmenam" : "Ceļš līdz gatavībai"}
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <Check2 ok={d.readiness.examsPassed === 3}>
              Pēdējie 3 izmēģinājuma eksāmeni nokārtoti: {d.readiness.examsPassed} no 3
            </Check2>
            <Check2 ok={d.readiness.topicsBelow.length === 0}>
              Tēmas apgūtas vismaz par {READY_TOPIC_PERCENT} %: {topicsDone} no {totalTopics}
            </Check2>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:border-l lg:border-line lg:pl-10">
          <Stat value={`${masteredPct} %`} label="jautājumu apgūti" />
          <Stat value={d.unanswered} label="vēl nav atbildēti" />
          <Stat value={plural(d.streak, "diena", "dienas", "dienu")} label="sērija pēc kārtas" />
          <Stat value={d.dueReviews} label="kļūdas jāatkārto" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {d.weakTopics.length > 0 ? (
            <>
              Vājās tēmas:{" "}
              {d.weakTopics.map((t, i) => (
                <span key={t.id}>
                  {i > 0 && ", "}
                  <Link href={`/tema/${topicSlug(t.id)}/trenins`} className="font-semibold text-ink underline underline-offset-4 hover:text-accent">
                    {t.id} {t.title}
                  </Link>
                </span>
              ))}
            </>
          ) : d.answeredQuestions === 0 ? (
            "Sāc ar 1. moduli — tas ir bez maksas."
          ) : (
            "Apgūts = pēdējā atbilde uz jautājumu bija pareiza."
          )}
        </p>
        <div className="flex shrink-0 flex-wrap gap-3">
          {d.dueReviews > 0 && (
            <Link href="/kludas" className="btn-primary">
              Atkārtot kļūdas ({d.dueReviews})
            </Link>
          )}
          {d.answeredQuestions === 0 ? (
            <Link href="/modulis/M1" className="btn-primary">Sākt ar 1. moduli</Link>
          ) : (
            <Link href="/eksamens" className={d.dueReviews > 0 ? "btn-secondary" : "btn-primary"}>
              Izmēģinājuma eksāmens
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
