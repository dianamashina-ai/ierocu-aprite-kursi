import Link from "next/link";
import { buyPath } from "@/config/pricing";
import { ProductCard } from "@/components/billing/product-card";

/** Sākumlapa viesiem: komplekts (melns), kurss un praktiskā nodarbība (balti). Telefonā — horizontāls slīdnis. */
export function Pricing({ included }: { included: string[] }) {
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
          <ProductCard
            code="bundle"
            courseItems={included}
            className="flex w-[85%] max-w-sm shrink-0 snap-start lg:w-auto lg:max-w-none"
            action={
              <Link
                href={buyPath("bundle")}
                className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 font-semibold text-ink transition-colors hover:bg-white/90"
              >
                Iegādāties komplektu
              </Link>
            }
          />
          <ProductCard
            code="course"
            courseItems={included}
            className="flex w-[85%] max-w-sm shrink-0 snap-start lg:w-auto lg:max-w-none"
            action={
              <Link href={buyPath("course")} className="btn-primary">
                Iegādāties pilnu kursu
              </Link>
            }
          />
          <ProductCard
            code="lesson"
            courseItems={included}
            className="flex w-[85%] max-w-sm shrink-0 snap-start lg:w-auto lg:max-w-none"
            action={
              <Link href={buyPath("lesson")} className="btn-secondary">
                Iegādāties nodarbību
              </Link>
            }
          />
        </div>
      </div>
    </section>
  );
}
