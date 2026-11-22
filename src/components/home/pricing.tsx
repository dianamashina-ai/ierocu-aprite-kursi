import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { COURSE_PRODUCT, splitVat } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

/** Sākumlapa viesiem: cena un kas iekļauts. */
export function Pricing({ included }: { included: string[] }) {
  const { vatCents } = splitVat(COURSE_PRODUCT.amountCents, COURSE_PRODUCT.vatRate);
  return (
    <section id="cena" aria-labelledby="cena-h" className="scroll-mt-6 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-24">
        <div>
          <h2 id="cena-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">Cena</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Sāc ar 1. moduli bez maksas — maksājumu karte nav vajadzīga. Ja patīk, atver pilnu kursu ar vienu maksājumu.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <p className="text-sm text-muted">Pilna piekļuve</p>
          <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums">{formatEuro(COURSE_PRODUCT.amountCents)}</p>
          <p className="mt-2 text-sm text-muted">
            t. sk. PVN {COURSE_PRODUCT.vatRate} % — {formatEuro(vatCents)}. Vienreizējs maksājums, bez abonementa un bez termiņa.
          </p>
          <ul className="mt-6 space-y-3">
            {included.map((x) => (
              <li key={x} className="flex gap-3">
                <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok" strokeWidth={2.5} />
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/registreties" className="btn-primary gap-2">
              Sākt bez maksas <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/iegadaties" className="inline-flex min-h-12 items-center font-semibold hover:text-accent">
              Iegādāties pilnu piekļuvi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
