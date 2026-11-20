import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { PracticeQuestion } from "@/lib/quiz/types";
import { uppercaseLetterRefs } from "@/lib/quiz/shuffle";
import { COURSE_PRODUCT } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

interface Stats {
  modules: number;
  topics: number;
  questions: number;
  examMinutes: number;
  examQuestions: number;
}

/** Sākumlapas galvenais ekrāns viesiem: virsraksts, aicinājums un īsts treniņa jautājuma paraugs. */
export function Hero({ stats, sample }: { stats: Stats; sample: PracticeQuestion | null }) {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Sagatavošanās eksāmenam</p>
            <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
              Ceļš līdz <span className="text-accent">ieroču atļaujai</span> sākas šeit
            </h1>
            <p className="mt-5 text-xl font-semibold text-ink">Saproti likumu, nevis iekal atbildes.</p>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
              Īsas nodarbības latviešu valodā, visi oficiālie eksāmena jautājumi ar skaidrojumiem un atsaucēm uz likumu,
              kā arī eksāmena simulācija — telefonā vai datorā, savā tempā.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/registreties" className="btn-primary gap-2">
                Sākt bez maksas <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/tema/1-1/trenins" className="inline-flex min-h-12 items-center gap-2 font-semibold hover:text-accent">
                Izmēģināt jautājumus <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <p className="mt-5 max-w-md text-sm text-muted">
              1. modulis ir bez maksas, maksājumu karte nav vajadzīga. Pilns kurss — {formatEuro(COURSE_PRODUCT.amountCents)}, vienreizējs maksājums.
            </p>
          </div>

          {sample && <SampleQuestion q={sample} />}
        </div>
      </section>

      <section aria-label="Kurss skaitļos" className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:pb-20">
        <dl className="grid grid-cols-2 rounded-2xl bg-accent text-white lg:grid-cols-4">
          {[
            [String(stats.modules), "moduļi no ieroča uzbūves līdz atbildībai"],
            [String(stats.topics), "īsas nodarbības pēc likuma teksta"],
            [String(stats.questions), "oficiālie jautājumi ar skaidrojumiem"],
            [`${stats.examMinutes} min`, `eksāmena simulācija — ${stats.examQuestions} jautājumi`],
          ].map(([value, label], i) => (
            <div key={label} className={`py-8 lg:py-10 px-5 sm:px-8 ${["", "border-l", "border-t lg:border-l lg:border-t-0", "border-l border-t lg:border-t-0"][i]} border-white/20`}>
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block whitespace-nowrap text-4xl font-bold tabular-nums tracking-tight sm:text-6xl">{value}</span>
                <span className="mt-2 block text-sm text-white/80">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
        </div>
      </section>
    </>
  );
}

function SampleQuestion({ q }: { q: PracticeQuestion }) {
  const letters = "ABCDEF";
  return (
    <figure className="relative">
      <div aria-hidden="true" className="absolute -inset-3 -z-0 rounded-[28px] bg-surface" />
      <div className="relative rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_-28px_rgba(34,34,34,0.35)] sm:p-6">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-semibold uppercase tracking-[0.16em]">Treniņš · 1. modulis</span>
          <span className="tabular-nums">Nr. {q.id}</span>
        </div>
        <p className="mt-4 text-lg font-semibold leading-snug" lang="lv">{q.text}</p>
        <ul className="mt-4 space-y-2" lang="lv">
          {q.options.map((o, i) => {
            const right = o.key === q.correctKey;
            return (
              <li
                key={o.key}
                className={`flex items-start gap-3 rounded-xl border-2 px-3.5 py-2.5 text-[15px] ${right ? "border-ok bg-ok-soft" : "border-line text-muted"}`}
              >
                <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${right ? "bg-ok text-white" : "bg-accent-soft text-ink"}`}>
                  {right ? <Check aria-hidden="true" className="size-3.5" strokeWidth={3} /> : letters[i]}
                </span>
                <span>{uppercaseLetterRefs(o.text)}</span>
              </li>
            );
          })}
        </ul>
        {q.explanation && (
          <div className="mt-4 rounded-xl bg-surface p-4 text-sm">
            <p className="font-semibold">Skaidrojums</p>
            <p className="mt-1 text-muted">{q.explanation}</p>
            {q.lawReference && <p className="mt-2 text-xs text-muted">{q.lawReference}</p>}
          </div>
        )}
      </div>
      <figcaption className="relative mt-4 text-center text-sm text-muted">Tā izskatās treniņš: pēc katras atbildes — skaidrojums ar atsauci uz likumu.</figcaption>
    </figure>
  );
}
