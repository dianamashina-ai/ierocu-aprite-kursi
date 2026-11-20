"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shuffleOptions } from "@/lib/quiz/shuffle";
import { finishExamAction, saveExamAnswerAction } from "@/app/actions/progress";

export interface ExamQuestion {
  id: number;
  text: string;
  options: { key: string; text: string }[];
  shuffleDisabled: boolean;
}

interface Props {
  attemptId: string;
  seed: string;
  questions: ExamQuestion[];
  initialSelected: Record<string, string>;
  deadline: string; // ISO
  serverNow: string; // ISO — pulksteņa nobīdes korekcijai
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function ExamRunner({ attemptId, seed, questions, initialSelected, deadline, serverNow }: Props) {
  const router = useRouter();
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>(initialSelected);
  const [confirming, setConfirming] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offset = useRef(new Date(serverNow).getTime() - Date.now());
  const deadlineMs = new Date(deadline).getTime();
  const [left, setLeft] = useState(() => deadlineMs - (Date.now() + offset.current));

  const q = questions[pos];
  const shown = useMemo(() => shuffleOptions(q.options, `${seed}:${q.id}`, { disabled: q.shuffleDisabled }), [q, seed]);
  const answeredCount = questions.filter((x) => selected[x.id]).length;

  const finish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    const r = await finishExamAction(attemptId);
    if (!r.ok) {
      setError(r.error);
      setFinishing(false);
      return;
    }
    router.refresh();
  }, [attemptId, finishing, router]);

  useEffect(() => {
    const t = setInterval(() => {
      const l = deadlineMs - (Date.now() + offset.current);
      setLeft(l);
      if (l <= 0) {
        clearInterval(t);
        finish();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadlineMs, finish]);

  const choose = (key: string) => {
    setSelected((s) => ({ ...s, [q.id]: key }));
    setError(null);
    saveExamAnswerAction(attemptId, q.id, key).then(
      (r) => {
        if (!r.ok) {
          setError(r.error);
          if (r.error === "Laiks ir beidzies" || r.error === "Eksāmens jau ir pabeigts") router.refresh();
        }
      },
      () => setError("Atbildi neizdevās saglabāt. Pārbaudi interneta savienojumu un izvēlies vēlreiz."),
    );
  };

  const lowTime = left < 5 * 60_000;

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-4 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            Atbildēti {answeredCount} no {questions.length}
          </span>
          <span
            className={`rounded-lg px-3 py-1 font-bold tabular-nums ${lowTime ? "bg-err-soft text-err" : "bg-white text-ink"}`}
            role="timer"
            aria-label="Atlikušais laiks"
          >
            {fmt(left)}
          </span>
        </div>
      </div>

      <nav aria-label="Jautājumi" className="flex flex-wrap gap-1.5">
        {questions.map((x, i) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setPos(i)}
            aria-current={i === pos ? "step" : undefined}
            aria-label={`Jautājums ${i + 1}${selected[x.id] ? ", atbildēts" : ""}`}
            className={`size-10 rounded-lg text-sm font-semibold tabular-nums ${
              i === pos
                ? "bg-accent text-white"
                : selected[x.id]
                  ? "bg-accent-soft text-accent-strong"
                  : "border border-line bg-white text-muted"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <article className="rounded-2xl border border-line bg-white p-5 sm:p-7" aria-labelledby={`eq-${q.id}`}>
        <p className="text-sm text-muted">
          {pos + 1}. jautājums no {questions.length}
        </p>
        <h2 id={`eq-${q.id}`} className="mt-1 text-lg font-semibold leading-snug sm:text-xl" lang="lv">
          {q.text}
        </h2>
        <fieldset className="mt-5">
          <legend className="sr-only">Izvēlies atbildi</legend>
          <ul className="space-y-3">
            {shown.map((o) => {
              const isSel = selected[q.id] === o.originalKey;
              return (
                <li key={o.originalKey}>
                  <button
                    type="button"
                    onClick={() => choose(o.originalKey)}
                    aria-pressed={isSel}
                    className={`flex min-h-14 w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left ${
                      isSel ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-accent"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        isSel ? "bg-accent text-white" : "bg-accent-soft text-accent-strong"
                      }`}
                    >
                      {o.displayKey}
                    </span>
                    <span className="flex-1" lang="lv">
                      <span className="sr-only">{o.displayKey}. </span>
                      {o.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-err-soft px-3 py-2 text-sm text-err">
            {error}
          </p>
        )}
      </article>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-secondary" disabled={pos === 0} onClick={() => setPos((p) => p - 1)}>
          ← Iepriekšējais
        </button>
        {pos < questions.length - 1 ? (
          <button type="button" className="btn-primary" onClick={() => setPos((p) => p + 1)}>
            Nākamais →
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={() => setConfirming(true)}>
            Pabeigt eksāmenu
          </button>
        )}
      </div>

      <div className="border-t border-line pt-5">
        {!confirming ? (
          <button type="button" className="btn-ghost" onClick={() => setConfirming(true)}>
            Pabeigt eksāmenu
          </button>
        ) : (
          <div role="dialog" aria-labelledby="confirm-h" className="rounded-2xl border-2 border-accent bg-white p-5">
            <p id="confirm-h" className="font-semibold">Pabeigt eksāmenu?</p>
            <p className="mt-1 text-sm text-muted">
              {answeredCount < questions.length
                ? `Neatbildēti ${questions.length - answeredCount} jautājumi — tie tiks skaitīti kā nepareizi.`
                : "Visi jautājumi atbildēti."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" disabled={finishing} onClick={finish}>
                Jā, pabeigt
              </button>
              <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
                Turpināt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
