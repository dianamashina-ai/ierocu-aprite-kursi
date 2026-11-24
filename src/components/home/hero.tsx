import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Clock } from "lucide-react";
import { COURSE_PRODUCT } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

interface Stats {
  modules: number;
  topics: number;
  questions: number;
  examMinutes: number;
  examQuestions: number;
}

/** Sākumlapas galvenais ekrāns viesiem: virsraksts, aicinājums un kurss skaitļos. */
export function Hero({ stats }: { stats: Stats }) {
  const items: [string, string][] = [
    [String(stats.modules), "moduļi no ieroča uzbūves līdz atbildībai"],
    [String(stats.topics), "īsas tēmas pēc likuma teksta"],
    [String(stats.questions), "oficiālie jautājumi ar skaidrojumiem"],
    [`${stats.examMinutes} min`, `eksāmena simulācija — ${stats.examQuestions} jautājumi`],
  ];
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Sagatavošanās eksāmenam</p>
            <h1 className="mt-4 text-[3.25rem] font-semibold leading-[1] tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
              Ceļš līdz <span className="text-accent">ieroču atļaujai</span> sākas šeit
            </h1>
            <p className="mt-5 text-xl font-semibold text-ink">Saproti likumu, nevis iekal atbildes.</p>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
              Īsas tēmas latviešu valodā, visi oficiālie eksāmena jautājumi ar skaidrojumiem un atsaucēm uz likumu,
              kā arī eksāmena simulācija — telefonā vai datorā, savā tempā.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/registreties" className="btn-primary gap-2">
                Sākt bez maksas <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/iegadaties" className="inline-flex min-h-12 items-center gap-2 font-semibold hover:text-accent">
                Iegādāties pilnu kursu <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <p className="mt-5 max-w-md text-sm text-muted">
              1. modulis ir bez maksas, maksājumu karte nav vajadzīga. Pilns kurss — {formatEuro(COURSE_PRODUCT.amountCents)}, vienreizējs maksājums.
            </p>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section aria-label="Kurss skaitļos" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:pb-20">
          <dl className="grid grid-cols-2 rounded-2xl bg-surface lg:grid-cols-4">
            {items.map(([value, label], i) => (
              <div key={label} className={`border-line px-5 py-5 sm:px-7 lg:py-6 ${["", "border-l", "border-t lg:border-l lg:border-t-0", "border-l border-t lg:border-t-0"][i]}`}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block whitespace-nowrap text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">{value}</span>
                  <span className="mt-1 block text-sm text-muted">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}

/** Dekoratīvs platformas priekšskatījums: progress, eksāmena jautājums ar taimeri, mēģinājumi. */
function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto hidden w-full max-w-md select-none md:block lg:max-w-none">
      <div className="absolute inset-x-6 inset-y-4 -z-0 rounded-[32px] bg-accent-soft sm:inset-x-10" />
      <div className="relative flex flex-col gap-4 py-2">
        {/* progress */}
        <div className="ml-auto w-[78%] rounded-2xl border border-line bg-white p-4 shadow-[0_18px_40px_-24px_rgba(34,34,34,0.35)]">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted">Tavs progress</p>
              <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight">72%</p>
            </div>
            <p className="text-xs tabular-nums text-muted">371 no 515 jautājumiem</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent-soft">
            <div className="h-full w-[72%] rounded-full bg-accent" />
          </div>
        </div>

        {/* eksāmena jautājums */}
        <div className="w-[88%] rounded-2xl border border-line bg-white p-4 shadow-[0_24px_50px_-24px_rgba(34,34,34,0.4)]">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold uppercase tracking-[0.14em]">Izmēģinājuma eksāmens</span>
            <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-ink">
              <Clock className="size-3.5" /> 31:42
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">Jautājums 12 no 40</p>
          <div className="mt-2 space-y-1.5">
            <div className="h-2.5 w-[90%] rounded-full bg-line" />
            <div className="h-2.5 w-[65%] rounded-full bg-line" />
          </div>
          <div className="mt-4 space-y-2">
            {[false, true, false].map((on, i) => (
              <div key={i} className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 ${on ? "border-accent bg-accent-soft" : "border-line"}`}>
                <span className={`size-4 shrink-0 rounded-full border-2 ${on ? "border-accent bg-accent" : "border-line"}`} />
                <span className={`h-2 rounded-full ${on ? "bg-accent/40" : "bg-line"}`} style={{ width: `${[70, 55, 80][i]}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* mēģinājumi */}
        <div className="ml-auto w-[62%] rounded-2xl border border-line bg-white p-4 shadow-[0_18px_40px_-24px_rgba(34,34,34,0.35)]">
          <p className="text-xs text-muted">Izmēģinājuma eksāmeni</p>
          <div className="mt-2 flex gap-1.5">
            {[true, true, true, null, null].map((r, i) => (
              <span key={i} className={`flex size-7 items-center justify-center rounded-full ${r ? "bg-ok text-white" : "border border-dashed border-line"}`}>
                {r && <Check className="size-3.5" strokeWidth={3} />}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
