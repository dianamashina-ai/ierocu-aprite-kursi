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

/** Sākumlapa viesiem: trīs produkti — kurss, praktiskā nodarbība, abi kopā. */
export function Pricing({ included }: { included: string[] }) {
  const saving = COURSE_PRODUCT.amountCents + LESSON_PRODUCT.amountCents - BUNDLE_PRODUCT.amountCents;
  return (
    <section id="cena" aria-labelledby="cena-h" className="scroll-mt-6 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <h2 id="cena-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Cena
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Sāc ar 1. moduli bez maksas — maksājumu karte nav vajadzīga. Pilnu kursu, praktisko nodarbību šautuvē vai abus kopā
            iegādājies ar vienu maksājumu. Cenas ar PVN.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <article className="flex flex-col rounded-2xl bg-ink p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm text-white/70">{BUNDLE_PRODUCT.title}</h3>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Ietaupi {formatEuro(saving)}</span>
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

          <article className="flex flex-col rounded-2xl border border-line bg-white p-6 sm:p-8">
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

          <article className="flex flex-col rounded-2xl border border-line bg-white p-6 sm:p-8">
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
