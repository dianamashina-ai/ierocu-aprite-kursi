import Link from "next/link";
import { Check } from "lucide-react";
import { BUNDLE_PRODUCT, buyPath, COURSE_PRODUCT, LESSON_INCLUDES, LESSON_PRODUCT, LESSON_SCHEDULING } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

function Items({ items, dark = false }: { items: readonly string[]; dark?: boolean }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((x) => (
        <li key={x} className="flex gap-3">
          <Check aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${dark ? "text-white" : "text-ok"}`} strokeWidth={2.5} />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

/** Sākumlapa viesiem: komplekts (melns), kurss un praktiskā nodarbība (balti). Telefonā — horizontāls slīdnis. */
export function Pricing({ included }: { included: string[] }) {
  const saving = COURSE_PRODUCT.amountCents + LESSON_PRODUCT.amountCents - BUNDLE_PRODUCT.amountCents;
  return (
    <section id="cena" aria-labelledby="cena-h" className="scroll-mt-6 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-3xl">
          <h2 id="cena-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Cenas
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Tiešsaistes kurss teorijai, praktiskā nodarbība šautuvē vai abi kopā.
          </p>
        </div>

        <div className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
          <article className="flex w-[85%] max-w-sm shrink-0 snap-start flex-col rounded-2xl lg:w-auto lg:max-w-none bg-ink p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm text-white/70">{BUNDLE_PRODUCT.title}</h3>
              <span className="rounded-full bg-ok px-3 py-1 text-xs font-semibold text-white">Ietaupi {formatEuro(saving)}</span>
            </div>
            <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums">{formatEuro(BUNDLE_PRODUCT.amountCents)}</p>
            <p className="mt-2 text-sm text-white/70">Teorija tiešsaistē un prakse šautuvē — viss sagatavošanai.</p>
            <Items items={["Viss, kas iekļauts mācību kursā", ...LESSON_INCLUDES]} dark />
            <p className="mt-6 text-sm text-white/70">{LESSON_SCHEDULING}</p>
            <div className="mt-auto pt-8">
              <Link
                href={buyPath("bundle")}
                className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 font-semibold text-ink transition-colors hover:bg-white/90"
              >
                Iegādāties komplektu
              </Link>
            </div>
          </article>

          <article className="flex w-[85%] max-w-sm shrink-0 snap-start flex-col rounded-2xl border border-line bg-white p-6 sm:p-8 lg:w-auto lg:max-w-none">
            <h3 className="text-sm text-muted">{COURSE_PRODUCT.title}</h3>
            <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums">{formatEuro(COURSE_PRODUCT.amountCents)}</p>
            <p className="mt-2 text-sm text-muted">Vienreizējs maksājums, bez abonementa un bez termiņa.</p>
            <Items items={included} />
            <div className="mt-auto pt-8">
              <Link href={buyPath("course")} className="btn-primary">
                Iegādāties pilnu kursu
              </Link>
            </div>
          </article>

          <article className="flex w-[85%] max-w-sm shrink-0 snap-start flex-col rounded-2xl lg:w-auto lg:max-w-none border border-line bg-white p-6 sm:p-8">
            <h3 className="text-sm text-muted">{LESSON_PRODUCT.title}</h3>
            <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums">{formatEuro(LESSON_PRODUCT.amountCents)}</p>
            <p className="mt-2 text-sm text-muted">Mūsu šautuvē ar sertificētu instruktoru.</p>
            <Items items={LESSON_INCLUDES} />
            <p className="mt-6 text-sm text-muted">{LESSON_SCHEDULING}</p>
            <div className="mt-auto pt-8">
              <Link href={buyPath("lesson")} className="btn-secondary">
                Iegādāties nodarbību
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
