"use client";

import { TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  seededRandom,
  shuffleOptions,
  uppercaseLetterRefs,
} from "@/lib/quiz/shuffle";
import { FamilyDrawer } from "@/components/compare/family-drawer";
import { recordAnswerAction } from "@/app/actions/progress";
import type { PracticeQuestion } from "@/lib/quiz/types";

interface Props {
  questions: PracticeQuestion[];
  seed: string;
  /** Saite uz tēmas lapu (nodarbība) */
  topicHref?: string;
  /** kur ved krustiņš telefonā (pēc noklusējuma — tēma) */
  exitHref?: string;
  /** Vai jaukt jautājumu secību (vienam jautājumam — nē) */
  shuffleQuestions?: boolean;
  /** Pieslēgts lietotājs → atbildes tiek saglabātas */
  signedIn?: boolean;
  mode?: "practice" | "review";
  /** Rāda zem rezultātiem (piem., aicinājums uz pilno kursu) */
  upsell?: React.ReactNode;
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

export function Practice({
  questions,
  seed,
  topicHref,
  exitHref,
  shuffleQuestions = true,
  signedIn = false,
  mode = "practice",
  upsell,
}: Props) {
  const t = useTranslations("practice");
  const [round, setRound] = useState(0);
  const [pool, setPool] = useState<number[]>(() =>
    shuffledIndexes(questions.length, seed, shuffleQuestions),
  );
  /** treniņš ar vairākiem jautājumiem (arī tad, ja kļūdu atkārtojumā palicis viens) — fokusa režīms */
  const multi = questions.length > 1;
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); // oriģinālais burts
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [phase, setPhase] = useState<Phase>("question");
  const [saveError, setSaveError] = useState<string | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const q = questions[pool[pos]];
  const shown = useMemo(
    () =>
      q
        ? shuffleOptions(q.options, `${seed}:${round}:${q.id}`, {
            disabled: q.shuffleDisabled,
          })
        : [],
    [q, seed, round],
  );
  const answered = selected !== null;
  const isCorrect = answered && selected === q?.correctKey;
  const correctDisplay = (
    shown.find((o) => o.originalKey === q?.correctKey)?.displayKey ?? ""
  ).toUpperCase();
  const isLast = pos === pool.length - 1;

  const choose = useCallback(
    (originalKey: string) => {
      if (answered || !q) return;
      setSelected(originalKey);
      setResults((r) => ({ ...r, [q.id]: originalKey === q.correctKey }));
      if (signedIn) {
        recordAnswerAction(q.id, originalKey, mode).then(
          (r) => setSaveError(r.ok ? null : r.error),
          () =>
            setSaveError(
              "Neizdevās saglabāt atbildi. Pārbaudi interneta savienojumu.",
            ),
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
    if (pos > 0 || phase === "summary")
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      } else if (
        e.key === "Enter" &&
        answered &&
        multi &&
        target.tagName !== "BUTTON" &&
        target.tagName !== "A"
      ) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, answered, choose, next, phase, pool.length, multi]);

  const startRound = (indexes: number[]) => {
    const r = round + 1;
    setRound(r);
    setPool(
      shuffleQuestions
        ? shuffledIndexes(indexes.length, `${seed}:${r}`, true).map(
            (i) => indexes[i],
          )
        : indexes,
    );
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
      <div className="focus-mode flex min-h-dvh flex-col pb-12">
        {/* rezultāti paliek fokusa režīmā: sava galvene ar krustiņu */}
        <div className="sticky top-0 z-10 mx-[calc(50%-50vw)] mb-8 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 p-4">
            <span className="font-semibold">
              {mode === "review" ? t("titleReview") : t("titlePractice")}
            </span>
            <Link
              href={exitHref ?? topicHref ?? "/"}
              aria-label={t("exit")}
              className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-line hover:text-ink active:bg-line"
            >
              <X aria-hidden="true" className="size-5" />
            </Link>
          </div>
        </div>
        <section
          aria-labelledby="summary-h"
          className="mx-auto my-auto w-full max-w-2xl bg-white px-2 py-6 text-center sm:px-8"
        >
          <h2 id="summary-h" className="text-2xl font-semibold">
            {t("summaryHeading")}
          </h2>
          <p className="mt-2 text-lg">
            {t("summaryScore", { correct, total: ids.length })}
          </p>
          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-accent-soft"
            aria-hidden="true"
          >
            <div
              className="h-full bg-accent"
              style={{ width: `${(correct / ids.length) * 100}%` }}
            />
          </div>
          {!signedIn && (
            <p className="mt-4 rounded-xl bg-accent-soft p-4 text-sm">
              <Link
                href="/registreties"
                className="font-semibold text-accent-strong underline underline-offset-4"
              >
                Izveido kontu
              </Link>
              , lai progress un kļūdas tiktu saglabāti un atkārtoti pēc 1, 3 un
              7 dienām.
            </p>
          )}
          {wrongIdx.length === 0 && <p className="mt-4 text-ok">{t("allCorrect")}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {wrongIdx.length > 0 && (
              <button
                type="button"
                onClick={() => startRound(wrongIdx)}
                className="btn-primary"
              >
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
        {upsell && <div className="mx-auto mt-6 max-w-2xl">{upsell}</div>}
      </div>
    );
  }

  if (!q) return null;

  return (
    <div
      className={
        multi ? "has-sticky-footer focus-mode pb-28" : undefined
      }
    >
      {multi && (
        <div className="sticky top-0 z-10 mx-[calc(50%-50vw)] mb-8 border-b border-line bg-white/95 backdrop-blur">
          <div className="p-4">
            {/* fokusa režīma galvene (vietnes izvēlne paslēpta): virsraksts un krustiņš */}
            <div className="flex items-center justify-between gap-4 pb-2">
              <span className="font-semibold">
                {mode === "review" ? t("titleReview") : t("titlePractice")}
              </span>
              <Link
                href={exitHref ?? topicHref ?? "/"}
                aria-label={t("exit")}
                className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-line hover:text-ink active:bg-line"
              >
                <X aria-hidden="true" className="size-5" />
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">
                {t("progress", { current: pos + 1, total: pool.length })}
              </span>
            </div>
            <div
              className="mt-3 h-1 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label={t("progressLabel")}
              aria-valuemin={0}
              aria-valuemax={pool.length}
              aria-valuenow={pos + (answered ? 1 : 0)}
            >
              <div
                className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
                style={{
                  width: `${((pos + (answered ? 1 : 0)) / pool.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <article
        className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
        aria-labelledby={`q-${q.id}`}
      >
        <div className="lg:sticky lg:top-32 lg:self-start">
          {q.possiblyOutdated && (
            <aside
              className="mb-5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm leading-relaxed text-ink"
              aria-label={t("outdated")}
            >
              <p className="flex items-center gap-1.5 font-semibold text-warn">
                <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                {t("outdated")}
              </p>
              {q.outdatedNote && <p className="mt-1.5">{q.outdatedNote}</p>}
              <p className="mt-1.5 text-muted">{t("outdatedDisclaimer")}</p>
            </aside>
          )}
          <p className="mb-1.5 text-sm tabular-nums text-muted">Nr. {q.id}</p>
          <h2
            id={`q-${q.id}`}
            className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl"
            lang="lv"
          >
            {q.text}
          </h2>
        </div>

        <div>
          <fieldset>
            <legend className="sr-only">{t("chooseAnswer")}</legend>
            <ul className="space-y-3">
              {shown.map((o) => {
                const isSel = selected === o.originalKey;
                const isRight = o.originalKey === q.correctKey;
                let tone = "border-line bg-white hover:border-ink";
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
                      className={`flex min-h-14 w-full items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors disabled:cursor-default motion-reduce:transition-none ${tone}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase ${
                          answered && isRight
                            ? "bg-ok text-white"
                            : answered && isSel
                              ? "bg-err text-white"
                              : "bg-accent-soft text-ink"
                        }`}
                      >
                        {o.displayKey}
                      </span>
                      <span
                        className="flex-1 text-[16px] leading-relaxed"
                        lang="lv"
                      >
                        <span className="sr-only">
                          {o.displayKey.toUpperCase()}.{" "}
                        </span>
                        {uppercaseLetterRefs(o.text)}
                        {answered && isRight && (
                          <span className="sr-only"> — {t("correct")}</span>
                        )}
                        {answered && isSel && !isRight && (
                          <span className="sr-only"> — {t("wrong")}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <div aria-live="polite">
            {answered && (
              <div className="mt-6 space-y-4">
                {saveError && (
                  <p
                    role="alert"
                    className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err"
                  >
                    {saveError}
                  </p>
                )}
                <p
                  className={`text-lg font-semibold ${isCorrect ? "text-ok" : "text-err"}`}
                >
                  {isCorrect
                    ? t("correct")
                    : `${t("wrong")}. ${t("correctAnswerIs", { key: correctDisplay })}`}
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
                  <p className="mt-1 text-muted">
                    {q.explanation ?? t("explanationMissing")}
                  </p>
                  {q.lawReference && (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">
                        {t("lawReference")}:
                      </span>{" "}
                      {q.lawReference}
                    </p>
                  )}
                </div>

                {q.familyId && q.familySize > 1 && (
                  <div>
                    <FamilyDrawer
                      familyId={q.familyId}
                      from={q.id}
                      label={t("compareSimilar", { count: q.familySize })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {!multi ? (
            answered && (
              <div className="mt-4">
                <button
                  ref={nextRef}
                  type="button"
                  onClick={() => startRound([pool[0]])}
                  className="btn-primary"
                >
                  {t("tryAgain")}
                </button>
              </div>
            )
          ) : (
            <>
              {/* poga ekrāna apakšā (aktīva pēc atbildes) */}
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
                <div className="flex justify-end px-4">
                  <button
                    ref={nextRef}
                    type="button"
                    disabled={!answered}
                    onClick={next}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto lg:min-w-48"
                  >
                    {isLast ? t("finish") : t("next")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
