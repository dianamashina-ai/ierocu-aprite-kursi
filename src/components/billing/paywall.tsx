import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { COURSE_PRODUCT } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

/** Bloks slēgtam saturam: aicina iegādāties pilnu kursu (vienots ar sākumlapas melno kartīti). */
export function Paywall({ title = "Šī daļa pieejama ar pilnu piekļuvi", children }: { title?: string; children?: React.ReactNode }) {
  return (
    <section aria-labelledby="paywall-h" className="rounded-2xl bg-ink p-6 text-white sm:p-7">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
        <Lock aria-hidden="true" className="size-3.5" /> Pilnais kurss
      </p>
      <h2 id="paywall-h" className="mt-2 text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-2 text-white/70">
        {children ?? "Visi moduļi, nodarbības, skaidrojumi un izmēģinājuma eksāmens."} Vienreizējs maksājums{" "}
        {formatEuro(COURSE_PRODUCT.amountCents)} (ar PVN).
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href="/iegadaties"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-semibold text-ink transition-colors hover:bg-white/90"
        >
          Iegādāties pilnu kursu <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <Link href="/modulis/M1" className="inline-flex min-h-11 items-center font-semibold text-white/90 hover:text-white hover:underline">
          1. modulis — bez maksas
        </Link>
      </div>
    </section>
  );
}
