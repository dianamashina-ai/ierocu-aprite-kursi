"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { seededRandom, shuffleOptions } from "@/lib/quiz/shuffle";
import { recordAnswerAction } from "@/app/actions/progress";
import type { PracticeQuestion } from "@/lib/quiz/types";

interface Props {
  questions: PracticeQuestion[];
  seed: string;
  /** Saite uz tēmas lapu (nodarbība) */
  topicHref?: string;
  /** Vai jaukt jautājumu secību (vienam jautājumam — nē) */
  shuffleQuestions?: boolean;
  /** Pieslēgts lietotājs → atbildes tiek saglabātas */
  signedIn?: boolean;
  mode?: "practice" | "review";
}

type Phase = "question" | "summary";

function shuffledIndexes(n: number, seed: string, enabled: boolean) {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (!enabled) return idx;
  const rand = seededRandom(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export function Practice({ questions, seed, topicHref, shuffleQuestions = true, signedIn = false, mode = "practice" }: Props) {
  const t = useTranslations("practice");
  const [round, setRound] = useState(0);
  const [pool, setPool] = useState<number[]>(() => shuffledIndexes(questions.length, seed, shuffleQuestions));
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); // oriģinālais burts
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [phase, setPhase] = useState<Phase>("question");
  const [saveError, setSaveError] = useState<string | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const q = questions[pool[pos]];
  const shown = useMemo(
    () => (q ? shuffleOptions(q.options, `${seed}:${round}:${q.id}`, { disabled: q.shuffleDisabled }) : []),
    [q, seed, round],
  );
  const answered = selected !== null;
  const isCorrect = answered && selected === q?.correctKey;
  const correctDisplay = shown.find((o) => o.originalKey === q?.correctKey)?.displayKey ?? "";
  const isLast = pos === pool.length - 1;

  const choose = useCallback(
    (originalKey: string) => {
      if (answered || !q) return;
      setSelected(originalKey);
      setResults((r) => ({ ...r, [q.id]: originalKey === q.correctKey }));
      if (signedIn) {
        recordAnswerAction(q.id, originalKey, mode).then(
          (r) => setSaveError(r.ok ? null : r.error),
          () => setSaveError("Neizdevās saglabāt atbildi. Pārbaudi interneta savienojumu."),
        );
      }
    },
    [answered, q, signedIn, mode],
  );

  const next = useCallback(() => {
    if (!answered) return;
    if (isLast) {
      setPhase("summary");
    } else {
      setPos((p) => p + 1);
      setSelected(null);
    }
  }, [answered, isLast]);

  // fokuss uz "Nākamais" pēc atbildes — ērti ar tastatūru un ekrāna lasītājiem
  useEffect(() => {
    if (answered) nextRef.current?.focus({ preventScroll: true });
  }, [answered]);

  // ritinām uz kartītes sākumu, mainoties jautājumam
  useEffect(() => {
    if (pos > 0 || phase === "summary") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pos, phase]);

  useEffect(() => {
    if (phase !== "question") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      const opt = shown.find((o) => o.displayKey === k);
      if (opt && !answered) {
        e.preventDefault();
        choose(opt.originalKey);
      } else if (e.key === "Enter" && answered && pool.length > 1 && target.tagName !== "BUTTON" && target.tagName !== "A") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, answered, choose, next, phase, pool.length]);

  const startRound = (indexes: number[]) => {
    const r = round + 1;
    setRound(r);
    setPool(shuffleQuestions ? shuffledIndexes(indexes.length, `${seed}:${r}`, true).map((i) => indexes[i]) : indexes);
    setPos(0);
    setSelected(null);
    setResults({});
    setPhase("question");
  };

  if (phase === "summary") {
    const ids = pool.map((i) => questions[i].id);
    const correct = ids.filter((id) => results[id]).length;
    const wrongIdx = pool.filter((i) => !results[questions[i].id]);
    return (
      <section aria-labelledby="summary-h" className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <h2 id="summary-h" className="text-2xl font-semibold">
          {t("summaryHeading")}
        </h2>
        <p className="mt-2 text-lg">{t("summaryScore", { correct, total: ids.length })}</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
          <div className="h-full bg-accent" style={{ width: `${(correct / ids.length) * 100}%` }} />
        </div>
        {!signedIn && (
          <p className="mt-4 rounded-xl bg-accent-soft p-4 text-sm">
            <Link href="/registreties" className="font-semibold text-accent-strong underline underline-offset-4">Izveido kontu</Link>, lai progress un kļūdas tiktu saglabāti un atkārtoti pēc 1, 3 un 7 dienām.
          </p>
        )}
        {wrongIdx.length === 0 ? (
          <p className="mt-4 text-ok">{t("allCorrect")}</p>
        ) : (
          <ul className="mt-5 flex flex-wrap gap-2">
            {wrongIdx.map((i) => (
              <li key={questions[i].id}>
                <Link
                  href={`/jautajums/${questions[i].id}`}
                  className="inline-flex min-h-11 items-center rounded-lg bg-err-soft px-3 text-sm font-semibold text-err"
                >
                  Nr. {questions[i].id}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {wrongIdx.length > 0 && (
            <button type="button" onClick={() => startRound(wrongIdx)} className="btn-primary">
              {t("retryWrong", { count: wrongIdx.length })}
            </button>
          )}
          <button
            type="button"
            onClick={() => startRound(questions.map((_, i) => i))}
            className={wrongIdx.length > 0 ? "btn-secondary" : "btn-primary"}
          >
            {t("restart")}
          </button>
          {topicHref && (
            <Link href={topicHref} className="btn-secondary">
              {t("backToTopic")}
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (!q) return null;

  return (
    <div className="space-y-5">
      {pool.length > 1 && (
        <div>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>{t("progress", { current: pos + 1, total: pool.length })}</span>
            <span className="tabular-nums">Nr. {q.id}</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-accent-soft"
            role="progressbar"
            aria-label={t("progressLabel")}
            aria-valuemin={0}
            aria-valuemax={pool.length}
            aria-valuenow={pos + (answered ? 1 : 0)}
          >
            <div
              className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${((pos + (answered ? 1 : 0)) / pool.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <article className="rounded-2xl border border-line bg-white p-5 sm:p-7" aria-labelledby={`q-${q.id}`}>
        {q.possiblyOutdated && (
          <div className="mb-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
            <p className="font-semibold">{t("outdated")}</p>
            {q.outdatedNote && <p className="mt-1">{q.outdatedNote}</p>}
          </div>
        )}
        <h2 id={`q-${q.id}`} className="text-lg font-semibold leading-snug sm:text-xl" lang="lv">
          {q.text}
        </h2>

        <fieldset className="mt-5">
          <legend className="sr-only">{t("chooseAnswer")}</legend>
          <ul className="space-y-3">
            {shown.map((o) => {
              const isSel = selected === o.originalKey;
              const isRight = o.originalKey === q.correctKey;
              let tone = "border-line bg-white hover:border-accent hover:bg-accent-soft";
              if (answered) {
                if (isRight) tone = "border-ok bg-ok-soft";
                else if (isSel) tone = "border-err bg-err-soft";
                else tone = "border-line bg-white opacity-70";
              }
              return (
                <li key={o.originalKey}>
                  <button
                    type="button"
                    onClick={() => choose(o.originalKey)}
                    disabled={answered}
                    aria-pressed={isSel}
                    className={`flex min-h-14 w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors disabled:cursor-default motion-reduce:transition-none ${tone}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        answered && isRight
                          ? "bg-ok text-white"
                          : answered && isSel
                            ? "bg-err text-white"
                            : "bg-accent-soft text-accent-strong"
                      }`}
                    >
                      {o.displayKey}
                    </span>
                    <span className="flex-1" lang="lv">
                      <span className="sr-only">{o.displayKey}. </span>
                      {o.text}
                      {answered && isRight && <span className="sr-only"> — {t("correct")}</span>}
                      {answered && isSel && !isRight && <span className="sr-only"> — {t("wrong")}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div aria-live="polite">
          {answered && (
            <div className="mt-6 space-y-4 border-t border-line pt-5">
              {saveError && (
                <p role="alert" className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">{saveError}</p>
              )}
              <p className={`text-lg font-semibold ${isCorrect ? "text-ok" : "text-err"}`}>
                {isCorrect ? t("correct") : `${t("wrong")}. ${t("correctAnswerIs", { key: correctDisplay })}`}
              </p>

              <div className="rounded-xl bg-surface p-4">
                <h3 className="flex flex-wrap items-center gap-2 font-semibold">
                  {t("explanation")}
                  {q.explanation && q.explanationStatus === "draft" && (
                    <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
                      {t("explanationDraft")}
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-muted">{q.explanation ?? t("explanationMissing")}</p>
                {q.lawReference && (
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">{t("lawReference")}:</span> {q.lawReference}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {pool.length === 1 ? (
                  <button ref={nextRef} type="button" onClick={() => startRound([pool[0]])} className="btn-primary">
                    {t("tryAgain")}
                  </button>
                ) : (
                  <button ref={nextRef} type="button" onClick={next} className="btn-primary">
                    {isLast ? t("finish") : t("next")}
                  </button>
                )}
                {q.familyId && q.familySize > 1 && (
                  <Link href={`/saime/${q.familyId}?no=${q.id}`} className="btn-secondary">
                    {t("compareSimilar", { count: q.familySize })}
                  </Link>
                )}
                {topicHref && (
                  <Link href={topicHref} className="btn-ghost">
                    {t("lesson")}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </article>

      <p className="hidden text-sm text-muted sm:block">{t("keyboardHint")}</p>
    </div>
  );
}
