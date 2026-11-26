import Link from "next/link";
import { ArrowRight, BookOpen, Check, Lock } from "lucide-react";
import { COURSE_PRODUCT } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

/**
 * Jautājums maksas modulī bez piekļuves: oficiālais teksts (meklētājiem un skolēnam), atbilžu vietā — slēgti
 * varianti un aicinājums. Varianti, pareizā atbilde un skaidrojums netiek nosūtīti uz pārlūku.
 */
export function LockedQuestion({
  text,
  optionCount,
  topicHref,
  topicLabel,
  signedIn,
}: {
  text: string;
  optionCount: number;
  topicHref: string;
  topicLabel: string;
  signedIn: boolean;
}) {
  const letters = "ABCDEF".slice(0, Math.max(2, Math.min(optionCount, 6))).split("");
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl" lang="lv">
          {text}
        </h1>
        <Link
          href={topicHref}
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-strong underline-offset-4 hover:underline"
        >
          <BookOpen aria-hidden="true" className="size-4" /> Tēma {topicLabel}
        </Link>
      </div>

      <div>
        <ul aria-label="Atbilžu varianti pieejami pilnajā kursā" className="space-y-3">
          {letters.map((l, i) => (
            <li key={l} className="flex items-center gap-4 rounded-2xl border border-line bg-white px-4 py-4" aria-hidden="true">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">{l}</span>
              <span className="flex flex-1 flex-col gap-2">
                <span className="h-3 rounded-full bg-surface" style={{ width: `${[92, 78, 86, 64, 72, 80][i]}%` }} />
                {i % 2 === 0 && <span className="h-3 w-2/5 rounded-full bg-surface" />}
              </span>
              <Lock className="size-4 shrink-0 text-muted/70" />
            </li>
          ))}
        </ul>

        <section aria-labelledby="locked-h" className="mt-6 rounded-2xl bg-ink p-6 text-white sm:p-7">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
            <Lock aria-hidden="true" className="size-3.5" /> Pilnais kurss
          </p>
          <h2 id="locked-h" className="mt-2 text-xl font-semibold tracking-tight">
            Atbilde un skaidrojums — pilnajā kursā
          </h2>
          <ul className="mt-4 space-y-2 text-white/80">
            {["Atbilžu varianti un pareizā atbilde", "Skaidrojums ar atsauci uz likumu", "Tēmas teorija, treniņš un izmēģinājuma eksāmens"].map((t) => (
              <li key={t} className="flex gap-2.5">
                <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-white" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/iegadaties"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-semibold text-ink transition-colors hover:bg-white/90"
            >
              Iegādāties — {formatEuro(COURSE_PRODUCT.amountCents)} <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href={signedIn ? "/modulis/M1" : `/registreties?next=${encodeURIComponent("/modulis/M1")}`}
              className="inline-flex min-h-11 items-center font-semibold text-white/90 hover:text-white hover:underline"
            >
              {signedIn ? "1. modulis — bez maksas" : "Sākt bez maksas"}
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/60">Vienreizējs maksājums ar PVN, bez abonementa. 1. modulis — bez maksas.</p>
        </section>
      </div>
    </div>
  );
}
