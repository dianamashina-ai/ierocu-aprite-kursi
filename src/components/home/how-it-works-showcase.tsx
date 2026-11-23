"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, ClipboardCheck, Clock, Repeat } from "lucide-react";
import type { PracticeQuestion } from "@/lib/quiz/types";
import { SampleQuestion } from "@/components/home/hero";

const ICONS = [BookOpen, Repeat, ClipboardCheck];
const INTERVAL = 4000;

export interface ShowcaseLesson {
  title: string;
  minutes: number;
}

/** “Kā notiek mācības”: soļi pa kreisi un mainīgs priekšskatījums pa labi (ik pēc 4 s; punktos redzams progress). */
export function HowItWorksShowcase({
  intro,
  steps,
  sample,
  lesson,
  examQuestions,
  examMinutes,
}: {
  intro: React.ReactNode;
  steps: { title: string; text: string }[];
  sample: PracticeQuestion | null;
  lesson: ShowcaseLesson;
  examQuestions: number;
  examMinutes: number;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const t = setTimeout(
      () => setActive((a) => (a + 1) % steps.length),
      INTERVAL,
    );
    return () => clearTimeout(t);
  }, [active, paused, steps.length]);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-20">
      <div>
        {intro}
        <ol className="mt-10 space-y-8">
          {steps.map(({ title, text }, i) => {
            const Icon = ICONS[i];
            return (
              <li key={title} className="flex gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    <span className="mr-2 tabular-nums text-accent-strong">{i + 1}.</span>
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* priekšskatījums */}
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-roledescription="karuselis"
        aria-label="Platformas priekšskatījums"
      >
        <div className="grid">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden={i !== active}
              className={`col-start-1 row-start-1 self-center transition-opacity duration-500 motion-reduce:transition-none ${i === active ? "opacity-100" : "pointer-events-none opacity-0 max-lg:hidden"}`}
            >
              {i === 0 && (
                <LessonSlide lesson={lesson} />
              )}
              {i === 1 && sample && <SampleQuestion q={sample} />}
              {i === 2 && (
                <ExamSlide questions={examQuestions} minutes={examMinutes} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center gap-2">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Rādīt: ${s.title}`}
              aria-current={i === active}
              className={`relative h-2 overflow-hidden rounded-full transition-all ${i === active ? "w-10 bg-line" : "w-2 bg-line hover:bg-muted/40"}`}
            >
              {i === active && (
                <span
                  key={active}
                  aria-hidden="true"
                  className="showcase-progress absolute inset-y-0 left-0 rounded-full bg-accent"
                  style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Frame({
  label,
  right,
  children,
  caption,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  caption: string;
}) {
  return (
    <figure className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-3 -z-0 rounded-[28px] bg-surface"
      />
      <div className="relative rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_-28px_rgba(34,34,34,0.35)] sm:p-6">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-semibold uppercase tracking-[0.16em]">
            {label}
          </span>
          {right}
        </div>
        {children}
      </div>
      <figcaption className="relative mt-4 text-center text-sm text-muted">
        {caption}
      </figcaption>
    </figure>
  );
}

/**
 * Nodarbības konspekta paraugs. Teksts — fragments no content/lessons/1-1.md
 * (definīcija no Ieroču aprites likuma 1. panta 42. punkta); mainot nodarbību, atjaunot arī šeit.
 */
function LessonSlide({ lesson }: { lesson: ShowcaseLesson }) {
  return (
    <Frame
      label="Nodarbība 1.1"
      right={
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Clock aria-hidden="true" className="size-3.5" />
          {lesson.minutes} min
        </span>
      }
      caption="Tā izskatās nodarbība: īss konspekts ar atsaucēm uz likumu."
    >
      <p className="mt-4 text-lg font-semibold leading-snug">{lesson.title}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full w-1/3 rounded-full bg-accent" />
      </div>
      <h4 className="mt-5 font-semibold">Šaujamierocis</h4>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
        <strong className="text-ink">Šaujamierocis</strong> — jebkurš <strong className="text-ink">pārnēsājams</strong> ierocis{" "}
        <strong className="text-ink">ar stobru</strong>, kas <strong className="text-ink">šaujampulvera vai cita propelenta</strong>{" "}
        iedarbības rezultātā raida šāviņu…
      </p>
      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-2 py-1 text-xs font-semibold text-ink">
        <BookOpen aria-hidden="true" className="size-3.5" />
        Ieroču aprites likums, 1. panta 42. punkts
      </p>
      <div className="mt-4 rounded-xl border-l-4 border-accent bg-surface px-4 py-3">
        <p className="text-sm font-semibold">Atceries</p>
        <ul className="mt-1.5 space-y-1 text-sm text-muted">
          <li>Šaujamierocis: stobrs + šaujampulveris/propelents.</li>
          <li>Pneimatiskais: saspiesta gāze.</li>
          <li>Lielas enerģijas: &gt; 12 J; mazas: ≤ 12 J.</li>
        </ul>
      </div>
    </Frame>
  );
}

function ExamSlide({
  questions,
  minutes,
}: {
  questions: number;
  minutes: number;
}) {
  return (
    <Frame
      label="Izmēģinājuma eksāmens"
      right={
        <span className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 font-semibold tabular-nums text-ink">
          <Clock aria-hidden="true" className="size-3.5" /> {minutes - 8}:42
        </span>
      }
      caption={`Tā izskatās eksāmens: ${questions} jautājumi, ${minutes} minūtes — kā īstajā.`}
    >
      <p className="mt-4 text-sm text-muted">Jautājums 12 no {questions}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(12 / questions) * 100}%` }}
        />
      </div>
      <div className="mt-5 space-y-2" aria-hidden="true">
        <div className="h-3 w-[92%] rounded-full bg-line" />
        <div className="h-3 w-[64%] rounded-full bg-line" />
      </div>
      <div className="mt-5 space-y-2" aria-hidden="true">
        {[72, 58, 84, 46].map((w, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 ${i === 1 ? "border-accent bg-accent-soft" : "border-line"}`}
          >
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === 1 ? "bg-accent text-white" : "bg-accent-soft text-ink"}`}
            >
              {"ABCD"[i]}
            </span>
            <span
              className={`h-2.5 rounded-full ${i === 1 ? "bg-accent/40" : "bg-line"}`}
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-surface px-4 py-3">
        <span className="text-sm text-muted">Izmēģinājuma eksāmeni</span>
        <span className="flex gap-1.5" aria-hidden="true">
          {[true, true, true, null, null].map((r, i) => (
            <span
              key={i}
              className={`flex size-6 items-center justify-center rounded-full ${r ? "bg-ok text-white" : "border border-dashed border-line"}`}
            >
              {r && <Check className="size-3" strokeWidth={3} />}
            </span>
          ))}
        </span>
      </div>
    </Frame>
  );
}
