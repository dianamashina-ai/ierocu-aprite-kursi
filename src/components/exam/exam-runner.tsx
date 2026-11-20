"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shuffleOptions, uppercaseLetterRefs } from "@/lib/quiz/shuffle";
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
  // pēc pārlādes turpinām no pirmā neatbildētā jautājuma
  const [pos, setPos] = useState(() => {
    const i = questions.findIndex((x) => !initialSelected[x.id]);
    return i === -1 ? questions.length - 1 : i;
  });
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

  const progress = ((pos + 1) / questions.length) * 100;

  return (
    <div className="focus-mode">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
          {/* telefonā — sava galvene (vietnes izvēlne paslēpta): virsraksts un krustiņš */}
          <div className="-mt-1 flex items-center justify-between gap-4 pb-2 lg:hidden">
            <span className="font-semibold">Izmēģinājuma eksāmens</span>
            <Link href="/eksamens" aria-label="Iziet (atbildes saglabātas, vari turpināt vēlāk)" className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-accent-soft hover:text-ink">
              <X aria-hidden="true" className="size-5" />
            </Link>
          </div>
          <div className="flex items-center justify-between gap-4 pb-3">
            <span className="text-base max-lg:text-sm max-lg:text-muted lg:font-semibold">
              Jautājums {pos + 1} no {questions.length}
            </span>
            <span
              className={`rounded-lg px-3 py-1.5 text-lg font-bold tabular-nums ${lowTime ? "bg-err-soft text-err" : "bg-accent-soft text-ink"}`}
              role="timer"
              aria-label="Atlikušais laiks"
            >
              {fmt(left)}
            </span>
          </div>
          <div
            className="h-1 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Eksāmena progress"
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-valuenow={pos + 1}
          >
            <div className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="has-sticky-footer mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6 sm:pt-12 lg:pb-12">
        <article className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14" aria-labelledby={`eq-${q.id}`}>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2 id={`eq-${q.id}`} className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl" lang="lv">
              {q.text}
            </h2>
          </div>

          <div>
            <fieldset>
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
                        className={`flex min-h-14 w-full items-start gap-3 rounded-xl border-2 bg-white px-4 py-3.5 text-left transition-colors ${
                          isSel ? "border-accent bg-accent-soft" : "border-line hover:border-ink"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase ${
                            isSel ? "bg-accent text-white" : "bg-accent-soft text-ink"
                          }`}
                        >
                          {o.displayKey}
                        </span>
                        <span className="flex-1 text-[16px] leading-relaxed" lang="lv">
                          <span className="sr-only">{o.displayKey.toUpperCase()}. </span>
                          {uppercaseLetterRefs(o.text)}
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

            {/* dators: pogas zem atbildēm */}
            <div className="mt-8 hidden flex-wrap items-center justify-between gap-3 lg:flex">
              <button type="button" className="btn-secondary" disabled={pos === 0} onClick={() => setPos((p) => p - 1)}>
                ← Iepriekšējais
              </button>
              {pos < questions.length - 1 ? (
                <button
                  type="button"
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!selected[q.id]}
                  title={selected[q.id] ? undefined : "Vispirms izvēlies atbildi"}
                  onClick={() => setPos((p) => p + 1)}
                >
                  Nākamais →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!selected[q.id]}
                  onClick={() => setConfirming(true)}
                >
                  Pabeigt eksāmenu
                </button>
              )}
            </div>

            {/* telefons: josla ekrāna apakšā — pa kreisi “Pabeigt”, pa labi bultiņas */}
            <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
              <button type="button" className="btn-ghost -ml-2 px-2" onClick={() => setConfirming(true)}>
                Pabeigt eksāmenu
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Iepriekšējais"
                  disabled={pos === 0}
                  onClick={() => setPos((p) => p - 1)}
                  className="btn-secondary size-12 px-0 disabled:opacity-40"
                >
                  <ArrowLeft aria-hidden="true" className="size-5" />
                </button>
                {pos < questions.length - 1 && (
                  <button
                    type="button"
                    aria-label="Nākamais"
                    disabled={!selected[q.id]}
                    onClick={() => setPos((p) => p + 1)}
                    className="btn-primary size-12 px-0 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowRight aria-hidden="true" className="size-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-line pt-6 max-lg:hidden max-lg:has-[[role=dialog]]:block">
              {!confirming ? (
                <button type="button" className="btn-ghost px-0" onClick={() => setConfirming(true)}>
                  Pabeigt eksāmenu
                </button>
              ) : (
                <div
                  role="dialog"
                  aria-labelledby="confirm-h"
                  className="rounded-2xl border-2 border-accent bg-white p-5 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:rounded-b-none max-lg:border-x-0 max-lg:border-b-0 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-lg:shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.25)]"
                >
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
        </article>
      </div>
    </div>
  );
}
