import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { examDeadline, getExamAttempt } from "@/lib/progress/service";
import { getPracticeQuestionsByIds } from "@/lib/content/queries";
import { shuffleOptions } from "@/lib/quiz/shuffle";
import { ExamRunner } from "@/components/exam/exam-runner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Izmēģinājuma eksāmens" };

export default async function ExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kludas?: string }>;
}) {
  const { id } = await params;
  const onlyWrong = (await searchParams).kludas === "1";
  const user = await requireUser(`/eksamens/${id}`);
  const attempt = await getExamAttempt(user.id, id);
  if (!attempt) notFound();
  const qs = await getPracticeQuestionsByIds(attempt.questionIds);
  const byId = new Map(qs.map((q) => [q.id, q]));
  const ordered = attempt.questionIds.map((qid) => byId.get(qid)!).filter(Boolean);

  if (attempt.status === "in_progress") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4 sm:py-8">
        <h1 className="sr-only">Izmēģinājuma eksāmens</h1>
        <ExamRunner
          attemptId={attempt.id}
          seed={attempt.seed}
          // eksāmena laikā klientam NEsūtām pareizās atbildes un skaidrojumus
          questions={ordered.map((q) => ({ id: q.id, text: q.text, options: q.options, shuffleDisabled: q.shuffleDisabled }))}
          initialSelected={attempt.selected}
          deadline={examDeadline(attempt).toISOString()}
          serverNow={new Date().toISOString()}
        />
      </div>
    );
  }

  const total = attempt.questionIds.length;
  const correct = attempt.correctCount ?? 0;
  const pct = Math.round((correct / total) * 100);
  const minutes = Math.max(1, Math.round(((attempt.finishedAt?.getTime() ?? 0) - attempt.startedAt.getTime()) / 60_000));
  const rows = ordered
    .map((q, i) => ({ q, i, sel: attempt.selected[String(q.id)] ?? null }))
    .filter((r) => !onlyWrong || r.sel !== r.q.correctKey);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <section className={`rounded-2xl border-2 p-6 ${attempt.passed ? "border-ok bg-ok-soft" : "border-err bg-err-soft"}`}>
        <h1 className={`text-2xl font-semibold ${attempt.passed ? "text-ok" : "text-err"}`}>
          {attempt.passed ? "Eksāmens nokārtots" : "Eksāmens nav nokārtots"}
        </h1>
        <p className="mt-2 text-lg">
          Pareizi {correct} no {total} ({pct} %). Nepieciešami {attempt.passPercent} %.
        </p>
        <p className="mt-1 text-sm text-muted">Laiks: {minutes} min no {attempt.durationMinutes}</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/eksamens" className="btn-primary">Jauns eksāmens</Link>
        <Link href="/kludas" className="btn-secondary">Kļūdu labošana</Link>
      </div>

      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Atbilžu analīze</h2>
        <Link href={onlyWrong ? `/eksamens/${id}` : `/eksamens/${id}?kludas=1`} className="text-sm font-semibold text-accent-strong underline underline-offset-4">
          {onlyWrong ? "Rādīt visus" : "Rādīt tikai kļūdas"}
        </Link>
      </div>

      <ol className="mt-4 space-y-4">
        {rows.map(({ q, i, sel }) => {
          const shown = shuffleOptions(q.options, `${attempt.seed}:${q.id}`, { disabled: q.shuffleDisabled });
          const ok = sel === q.correctKey;
          return (
            <li key={q.id} className="rounded-2xl border border-line bg-white p-5">
              <p className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-muted">{i + 1}. jautājums · Nr. {q.id}</span>
                <span className={`font-semibold ${ok ? "text-ok" : "text-err"}`}>{ok ? "Pareizi" : sel ? "Nepareizi" : "Nav atbildēts"}</span>
              </p>
              <p className="mt-2 font-semibold" lang="lv">{q.text}</p>
              <ul className="mt-3 space-y-2">
                {shown.map((o) => {
                  const isRight = o.originalKey === q.correctKey;
                  const isSel = o.originalKey === sel;
                  return (
                    <li
                      key={o.originalKey}
                      className={`flex gap-3 rounded-xl border-2 px-3 py-2 text-sm ${isRight ? "border-ok bg-ok-soft" : isSel ? "border-err bg-err-soft" : "border-line text-muted"}`}
                    >
                      <span className="font-semibold">{o.displayKey}</span>
                      <span className="flex-1" lang="lv">
                        {o.text}
                        {isSel && <span className="mt-0.5 block text-xs font-semibold">Tava atbilde</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 rounded-xl bg-surface p-3 text-sm text-muted">
                {q.explanation ?? "Skaidrojums šim jautājumam vēl tiek gatavots."}
              </div>
              {q.familyId && q.familySize > 1 && (
                <Link href={`/saime/${q.familyId}?no=${q.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline underline-offset-4">
                  Salīdzināt līdzīgos ({q.familySize})
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
