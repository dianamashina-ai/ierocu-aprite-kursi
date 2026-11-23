"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Check, ClipboardCheck, Clock, Crosshair, RotateCcw, Repeat, X } from "lucide-react";
import { LessonBlocks } from "@/components/lesson-body";
import type { Block } from "@/lib/content/lesson-markdown";
import { buyPath, LESSON_INCLUDES } from "@/config/pricing";
import type { PracticeQuestion } from "@/lib/quiz/types";
import { uppercaseLetterRefs } from "@/lib/quiz/shuffle";

const ICONS = [BookOpen, Repeat, ClipboardCheck, Crosshair];
const LETTERS = "ABCDEF";
/** Mini eksāmena laiks sekundēs (demonstrācijai) */
const DEMO_SECONDS = 90;

export interface ShowcaseLesson {
  /** Fragments no nodarbības (tieši tāds pats teksts) */
  blocks: Block[];
}

/**
 * “Kā notiek mācības”: interaktīvs mini ceļš — nodarbības fragments → viens treniņa jautājums → mini eksāmens.
 * Soļus var pārslēgt arī no saraksta pa kreisi.
 */
export function HowItWorksShowcase({
  intro,
  steps,
  lesson,
  practice,
  exam,
  examQuestions,
  examMinutes,
}: {
  intro: React.ReactNode;
  steps: { title: string; text: string }[];
  lesson: ShowcaseLesson;
  practice: PracticeQuestion | null;
  exam: PracticeQuestion[];
  examQuestions: number;
  examMinutes: number;
}) {
  const [step, setStep] = useState(0);
  // atslēga, lai “Mēģināt vēlreiz” atiestatītu soļa stāvokli
  const [run, setRun] = useState(0);
  const demo = useRef<HTMLDivElement>(null);
  const go = (i: number) => {
    setStep(i);
    setRun((r) => r + 1);
    // ja demonstrācijas augša nav redzama (telefonā tā ir zem soļu saraksta) — pieritinām
    requestAnimationFrame(() => {
      const el = demo.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    });
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-20">
      <div>
        {intro}
        <ol className="mt-10 space-y-8 lg:space-y-3">
          {steps.map(({ title, text }, i) => {
            const Icon = ICONS[i];
            const current = i === step;
            return (
              <li key={title}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={current ? "step" : undefined}
                  className={`flex w-full gap-5 rounded-2xl text-left transition-colors max-lg:pointer-events-none lg:p-4 ${current ? "lg:bg-surface" : "lg:hover:bg-surface/60"}`}
                >
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong ${current ? "lg:bg-accent lg:text-white" : ""}`}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block text-xl font-semibold tracking-tight">
                      <span className="mr-2 tabular-nums text-accent-strong">{i + 1}.</span>
                      {title}
                    </span>
                    <span className="mt-1.5 block text-[15px] leading-relaxed text-muted">{text}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div ref={demo} aria-live="polite" className="hidden scroll-mt-24 rounded-[28px] bg-surface p-3 lg:block">
        {step === 0 && <LessonStep key={`l${run}`} lesson={lesson} onNext={() => go(1)} />}
        {step === 1 && practice && <PracticeStep key={`p${run}`} q={practice} onNext={() => go(2)} />}
        {step === 2 && (
          <ExamStep
            key={`e${run}`}
            qs={exam}
            realQuestions={examQuestions}
            realMinutes={examMinutes}
            onRestart={() => go(2)}
            onNext={() => go(3)}
          />
        )}
        {step === 3 && <PracticalStep />}
        <p className="pt-3 pb-1 text-center text-sm text-muted">
          Solis {step + 1} no {steps.length}
        </p>
      </div>
    </div>
  );
}

function Frame({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_-28px_rgba(34,34,34,0.35)] sm:p-6">
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <span className="font-semibold uppercase tracking-[0.16em]">{label}</span>
          {right}
        </div>
        {children}
      </div>
    </div>
  );
}

const nextBtn = "btn-primary mt-5 w-full gap-2 sm:w-auto";

/** 1. solis: fragments no īstās 1.1. nodarbības — tas pats teksts un noformējums, pietiek nākamajiem jautājumiem. */
function LessonStep({ lesson, onNext }: { lesson: ShowcaseLesson; onNext: () => void }) {
  return (
    <Frame label="Tēma">
      <p className="mt-4 text-lg font-semibold leading-snug">Pamatjēdzieni un darbības princips</p>
      <div className="mt-3">
        <LessonBlocks blocks={lesson.blocks} compact />
      </div>
      <button type="button" onClick={onNext} className={nextBtn}>
        Pārbaudi sevi treniņā <ArrowRight aria-hidden="true" className="size-4" />
      </button>
    </Frame>
  );
}

/** 4. solis: praktiskā nodarbība šautuvē (pēc izvēles). */
function PracticalStep() {
  return (
    <Frame label="Pēc izvēles">
      <p className="mt-4 text-lg font-semibold leading-snug">Praktiskā nodarbība šautuvē</p>
      <ul className="mt-4 space-y-3">
        {LESSON_INCLUDES.map((x) => (
          <li key={x} className="flex gap-3 text-[15px]">
            <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok" strokeWidth={2.5} />
            <span>{x}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-muted">
        Nodarbība nav obligāta ieroču atļaujas saņemšanai. Tā palīdz justies drošāk, pirmo reizi turot ieroci rokās.
      </p>
      <Link href={buyPath("lesson")} className="btn-secondary mt-5 w-full sm:w-auto">
        Iegādāties nodarbību
      </Link>
    </Frame>
  );
}

function Options({
  q,
  picked,
  onPick,
  reveal,
}: {
  q: PracticeQuestion;
  picked: string | null;
  onPick: (key: string) => void;
  reveal: boolean;
}) {
  return (
    <ul className="mt-4 space-y-2" lang="lv">
      {q.options.map((o, i) => {
        const right = o.key === q.correctKey;
        const chosen = o.key === picked;
        const tone = reveal
          ? right
            ? "border-ok bg-ok-soft"
            : chosen
              ? "border-err bg-err-soft"
              : "border-line text-muted"
          : chosen
            ? "border-accent bg-accent-soft"
            : "border-line hover:border-ink/30";
        const badge = reveal ? (right ? "bg-ok text-white" : chosen ? "bg-err text-white" : "bg-accent-soft text-ink") : chosen ? "bg-accent text-white" : "bg-accent-soft text-ink";
        return (
          <li key={o.key}>
            <button
              type="button"
              disabled={reveal}
              onClick={() => onPick(o.key)}
              aria-pressed={chosen}
              className={`flex w-full items-start gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left text-[15px] transition-colors ${tone}`}
            >
              <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${badge}`}>
                {reveal && right ? (
                  <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                ) : reveal && chosen ? (
                  <X aria-hidden="true" className="size-3.5" strokeWidth={3} />
                ) : (
                  LETTERS[i]
                )}
              </span>
              <span>{uppercaseLetterRefs(o.text)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** 2. solis: viens oficiālais jautājums ar tūlītēju skaidrojumu. */
function PracticeStep({ q, onNext }: { q: PracticeQuestion; onNext: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked === q.correctKey;
  return (
    <Frame label="Treniņš">
      <p className="mt-4 text-lg font-semibold leading-snug" lang="lv">
        {q.text}
      </p>
      <Options q={q} picked={picked} onPick={setPicked} reveal={picked !== null} />
      {picked === null ? (
        <p className="mt-4 text-sm text-muted">Izvēlies atbildi — uzreiz redzēsi, vai tā ir pareiza.</p>
      ) : (
        <>
          <div className="mt-4 rounded-xl bg-surface p-4 text-sm">
            <p className={`font-semibold ${correct ? "text-ok" : "text-err"}`}>{correct ? "Pareizi!" : "Nepareizi"}</p>
            {q.explanation && <p className="mt-1 text-muted">{q.explanation}</p>}
            {q.lawReference && <p className="mt-2 text-xs text-muted">{q.lawReference}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4">
            <button type="button" onClick={onNext} className={nextBtn}>
              Kārtot mini eksāmenu <ArrowRight aria-hidden="true" className="size-4" />
            </button>
            {!correct && (
              <button type="button" onClick={() => setPicked(null)} className="btn-ghost mt-5">
                Mēģināt vēlreiz
              </button>
            )}
          </div>
        </>
      )}
    </Frame>
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** 3. solis: mini eksāmens — jautājumi pēc kārtas bez skaidrojumiem, taimeris, rezultāts beigās. */
function ExamStep({
  qs,
  realQuestions,
  realMinutes,
  onRestart,
  onNext,
}: {
  qs: PracticeQuestion[];
  realQuestions: number;
  realMinutes: number;
  onRestart: () => void;
  onNext: () => void;
}) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() => qs.map(() => null));
  const [left, setLeft] = useState(DEMO_SECONDS);
  const finished = i >= qs.length || left <= 0;

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  if (!qs.length) return null;

  if (finished) {
    const score = qs.filter((q, k) => answers[k] === q.correctKey).length;
    const passed = score === qs.length;
    return (
      <Frame label="Mini eksāmens · rezultāts">
        <p className="mt-5 text-5xl font-bold tabular-nums tracking-tight">
          {score}/{qs.length}
        </p>
        <p className={`mt-2 font-semibold ${passed ? "text-ok" : "text-ink"}`}>
          {passed ? "Nokārtots! Tā izskatās eksāmena beigas." : left <= 0 ? "Laiks beidzās." : "Gandrīz — pārskati kļūdas."}
        </p>
        <ul className="mt-4 space-y-2">
          {qs.map((q, k) => {
            const ok = answers[k] === q.correctKey;
            return (
              <li key={q.id} className="flex items-start gap-3 text-sm">
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-ok text-white" : "bg-err text-white"}`}
                >
                  {ok ? <Check aria-hidden="true" className="size-3" strokeWidth={3} /> : <X aria-hidden="true" className="size-3" strokeWidth={3} />}
                </span>
                <span lang="lv">
                  {q.text}{" "}
                  <span className="text-muted">— {uppercaseLetterRefs(q.options.find((o) => o.key === q.correctKey)?.text ?? "")}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 rounded-xl bg-surface px-4 py-3 text-sm text-muted">
          Pilnajā izmēģinājuma eksāmenā — {realQuestions} jautājumi un {realMinutes} minūtes.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/registreties" className="btn-primary gap-2">
            Sākt bez maksas <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
          <button type="button" onClick={onRestart} className="btn-ghost inline-flex items-center gap-1.5">
            <RotateCcw aria-hidden="true" className="size-4" /> Mēģināt vēlreiz
          </button>
        </div>
        <button type="button" onClick={onNext} className="btn-ghost mt-3 inline-flex items-center gap-1.5 px-0">
          Pēc izvēles: praktiskā nodarbība šautuvē <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </Frame>
    );
  }

  const q = qs[i];
  return (
    <Frame
      label="Mini eksāmens"
      right={
        <span className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 font-semibold tabular-nums text-ink">
          <Clock aria-hidden="true" className="size-3.5" /> {mmss(left)}
        </span>
      }
    >
      <p className="mt-4 text-sm text-muted">
        Jautājums {i + 1} no {qs.length}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(i / qs.length) * 100}%` }} />
      </div>
      <p className="mt-4 text-lg font-semibold leading-snug" lang="lv">
        {q.text}
      </p>
      <Options
        q={q}
        picked={answers[i]}
        reveal={false}
        onPick={(key) => setAnswers((a) => a.map((v, k) => (k === i ? key : v)))}
      />
      <button type="button" disabled={!answers[i]} onClick={() => setI(i + 1)} className={`${nextBtn} disabled:opacity-50`}>
        {i + 1 < qs.length ? "Nākamais jautājums" : "Pabeigt eksāmenu"} <ArrowRight aria-hidden="true" className="size-4" />
      </button>
    </Frame>
  );
}
