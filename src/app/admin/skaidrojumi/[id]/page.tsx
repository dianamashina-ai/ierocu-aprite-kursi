import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuestionForReview, listQuestionsForReview, type ExplanationStatus } from "@/lib/backoffice/service";
import { ExplanationBadge } from "@/components/admin/status-badge";
import { ExplanationEditor } from "@/components/admin/explanation-editor";
import { uppercaseLetterRefs } from "@/lib/quiz/shuffle";

export const metadata = { title: "Skaidrojums" };

export default async function ExplanationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; modulis?: string }>;
}) {
  const [{ id: raw }, sp] = await Promise.all([params, searchParams]);
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();
  const q = await getQuestionForReview(id);
  if (!q) notFound();

  // Nākamais jautājums tajā pašā sarakstā (tie paši filtri)
  const status = sp.status === "draft" || sp.status === "reviewed" ? (sp.status as ExplanationStatus) : undefined;
  const list = await listQuestionsForReview({ status, moduleId: sp.modulis });
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (sp.modulis) qs.set("modulis", sp.modulis);
  const suffix = qs.size ? `?${qs}` : "";
  const idx = list.findIndex((r) => r.id === id);
  const next = idx >= 0 ? list.slice(idx + 1).find((r) => r.id !== id) : list[0];
  const nextHref = next ? `/admin/skaidrojumi/${next.id}${suffix}` : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/skaidrojumi${suffix}`} className="text-sm font-semibold text-accent-strong underline underline-offset-4">← Uz sarakstu</Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/jautajums/${id}`} target="_blank" className="text-muted underline underline-offset-4 hover:text-ink">Skatīt kā skolēns ↗</Link>
          {nextHref && <Link href={nextHref} className="text-muted underline underline-offset-4 hover:text-ink">Nākamais →</Link>}
        </div>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <p className="flex items-center gap-3 text-sm text-muted">
            <span className="tabular-nums">Nr. {q.id} · tēma {q.topicId}</span>
            <ExplanationBadge status={q.explanationStatus} has={Boolean(q.explanation)} />
          </p>
          <h1 className="mt-3 text-xl font-semibold leading-snug" lang="lv">{q.text}</h1>
          <ul className="mt-5 space-y-2">
            {q.options.map((o) => {
              const right = o.key === q.correctKey;
              return (
                <li key={o.key} className={`flex gap-3 rounded-xl border-2 px-3 py-2 text-sm ${right ? "border-ok bg-ok-soft" : "border-line"}`}>
                  <span className="font-semibold uppercase">{o.key}</span>
                  <span className="flex-1" lang="lv">
                    {uppercaseLetterRefs(o.text)}
                    {right && <span className="mt-0.5 block text-xs font-semibold text-ok">Pareizā atbilde</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          {q.correctionNote && <p className="mt-4 rounded-lg bg-surface px-3 py-2 text-xs text-muted">Labojums: {q.correctionNote}</p>}
        </div>
        <ExplanationEditor
          key={q.id}
          id={q.id}
          explanation={q.explanation}
          lawReference={q.lawReference}
          outdatedNote={q.outdatedNote}
          nextHref={nextHref}
        />
      </div>
    </>
  );
}
