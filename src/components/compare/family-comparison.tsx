import Link from "next/link";
import { uppercaseLetterRefs } from "@/lib/quiz/shuffle";
import type { DiffToken, FamilyQuestionView } from "@/lib/quiz/diff";

export interface CompareLabels {
  summaryHeading: string;
  textDiffers: string;
  legendCorrect: string;
  legendUnique: string;
  legendChanged: string;
  openQuestion: string;
  /** satur {ids} */
  inQuestions: string;
}

function Tokens({ tokens }: { tokens: DiffToken[] }) {
  return (
    <>
      {tokens.map((t, i) =>
        t.changed ? (
          <mark key={i} className="rounded bg-warn-soft px-0.5 text-ink">
            {t.text}
          </mark>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </>
  );
}

/** Līdzīgo jautājumu salīdzinājums (lapā /saime un izbīdāmajā panelī). */
export function FamilyComparison({
  view,
  sharedText,
  from,
  labels: t,
  compact = false,
}: {
  view: FamilyQuestionView[];
  sharedText: string;
  from: number | null;
  labels: CompareLabels;
  compact?: boolean;
}) {
  return (
    <>
      <blockquote className="text-lg font-semibold leading-snug" lang="lv">
        {sharedText}
      </blockquote>

      <section className="mt-8" aria-labelledby="sum-h">
        <h2 id="sum-h" className="text-lg font-semibold">{t.summaryHeading}</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-line">
              {view.map((q) => (
                <tr key={q.id} className={q.id === from ? "bg-accent-soft" : undefined}>
                  <th scope="row" className="w-24 whitespace-nowrap px-4 py-3 align-top font-semibold tabular-nums">
                    Nr. {q.id}
                  </th>
                  <td className="px-4 py-3 text-ok" lang="lv">{q.correctText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Apzīmējumi">
        <li className="flex items-center gap-2"><span className="size-4 rounded border-2 border-ok bg-ok-soft" aria-hidden="true" /> {t.legendCorrect}</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded border-2 border-dashed border-accent" aria-hidden="true" /> {t.legendUnique}</li>
        <li className="flex items-center gap-2"><mark className="rounded bg-warn-soft px-1 text-ink">vārdi</mark> {t.legendChanged}</li>
      </ul>

      <div className={`mt-6 grid gap-5 ${compact ? "" : "lg:grid-cols-2"}`}>
        {view.map((q) => (
          <article
            key={q.id}
            className={`rounded-2xl border bg-white p-5 ${q.id === from ? "border-accent ring-2 ring-accent-soft" : "border-line"}`}
            aria-labelledby={`fq-${q.id}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id={`fq-${q.id}`} className="font-semibold">Nr. {q.id}</h3>
              {!compact && (
                <Link href={`/jautajums/${q.id}`} className="text-sm text-accent-strong underline-offset-4 hover:underline">
                  {t.openQuestion}
                </Link>
              )}
            </div>
            {q.textTokens && (
              <p className="mt-2 text-sm" lang="lv">
                <span className="font-semibold text-warn">{t.textDiffers}: </span>
                <Tokens tokens={q.textTokens} />
              </p>
            )}
            <ol className="mt-4 space-y-2">
              {q.options.map((o) => {
                const unique = !o.isMeta && o.sharedWith.length === 0;
                const tone = o.isCorrect ? "border-ok bg-ok-soft" : unique ? "border-dashed border-accent" : "border-line text-muted";
                const refTexts = o.refersTo?.map((k) => q.options.find((x) => x.key === k)?.text).filter(Boolean);
                return (
                  <li key={o.key} className={`flex gap-3 rounded-xl border-2 px-3 py-2.5 text-sm ${tone}`}>
                    <span className={`font-semibold uppercase ${o.isCorrect ? "text-ok" : "text-muted"}`}>{o.key}</span>
                    <span className="flex-1" lang="lv">
                      {o.tokens ? <Tokens tokens={o.tokens} /> : uppercaseLetterRefs(o.text)}
                      {o.isCorrect && <span className="sr-only"> — {t.legendCorrect}</span>}
                      {refTexts && refTexts.length > 0 && (
                        <span className="mt-1 block text-xs text-muted">= {refTexts.map((txt) => `«${txt}»`).join(" + ")}</span>
                      )}
                      {!o.isMeta && !unique && (
                        <span className="mt-1 block text-xs text-muted">
                          {t.inQuestions.replace("{ids}", o.sharedWith.map((i) => `Nr. ${i}`).join(", "))}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </>
  );
}
