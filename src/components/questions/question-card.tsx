import { ChevronDown } from "lucide-react";
import { highlightParts } from "@/lib/content/highlight";
import { uppercaseLetterRefs } from "@/lib/quiz/shuffle";

export interface QuestionCardData {
  id: number;
  text: string;
  correctKey: string;
  explanation: string | null;
  explanationStatus: "draft" | "reviewed";
  lawReference: string | null;
  options: { key: string; text: string }[];
}

function Marked({ text, stems }: { text: string; stems?: string[] }) {
  if (!stems?.length) return <>{text}</>;
  return (
    <>
      {highlightParts(text, stems).map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-warn-soft px-0.5 text-inherit">
            {p.text}
          </mark>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

/**
 * Jautājums ar visiem atbilžu variantiem (pareizais iezīmēts, ja ir piekļuve) un salokāmu skaidrojumu.
 * Lieto tēmas cilnē “Jautājumi” un meklēšanas rezultātos (ar izceltiem vārdiem).
 */
export function QuestionCard({ q, allowed, stems, meta }: { q: QuestionCardData; allowed: boolean; stems?: string[]; meta?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-9 shrink-0 pt-px tabular-nums text-muted">{q.id}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold" lang="lv">
          <Marked text={q.text} stems={stems} />
        </p>
        {meta}
        <ul className="mt-2 space-y-1.5" lang="lv">
          {q.options.map((o, i) => {
            const correct = allowed && o.key === q.correctKey;
            return (
              <li
                key={o.key}
                className={`flex gap-2.5 rounded-lg px-3 py-2 text-[15px] ${correct ? "bg-ok-soft text-ink group-data-[hide=true]/ans:bg-surface group-data-[hide=true]/ans:text-muted" : "bg-surface text-muted"}`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${correct ? "bg-ok text-white group-data-[hide=true]/ans:bg-white group-data-[hide=true]/ans:text-ink" : "bg-white text-ink"}`}
                >
                  {"ABCDEF"[i]}
                </span>
                <span>
                  <Marked text={uppercaseLetterRefs(o.text)} stems={stems} />
                  {correct && <span className="sr-only group-data-[hide=true]/ans:hidden"> (pareizā atbilde)</span>}
                </span>
              </li>
            );
          })}
        </ul>
        {allowed && (
          <details className="group/sk mt-2 group-data-[hide=true]/ans:hidden">
            <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 text-sm font-semibold text-accent-strong [&::-webkit-details-marker]:hidden">
              Skaidrojums
              <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open/sk:rotate-180" />
            </summary>
            <div className="mt-1 rounded-xl bg-surface p-4" lang="lv">
              {q.explanation && q.explanationStatus === "draft" && (
                <span className="mb-2 inline-block rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
                  Skaidrojums tiek pārbaudīts
                </span>
              )}
              <p className="text-muted">{q.explanation ?? "Skaidrojums šim jautājumam vēl tiek gatavots."}</p>
              {q.lawReference && (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Avots:</span> {q.lawReference}
                </p>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
