import Link from "next/link";
import { COURSE_PRODUCT } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

/** Bloks slēgtam saturam: aicina iegādāties pilnu piekļuvi. */
export function Paywall({ title = "Šī daļa pieejama ar pilnu piekļuvi", children }: { title?: string; children?: React.ReactNode }) {
  return (
    <section aria-labelledby="paywall-h" className="rounded-2xl border-2 border-accent bg-accent-soft p-5 sm:p-7">
      <p aria-hidden="true" className="text-2xl">🔒</p>
      <h2 id="paywall-h" className="mt-1 text-xl font-semibold text-accent-strong">{title}</h2>
      <p className="mt-2">
        {children ?? "Visi moduļi, nodarbības, skaidrojumi un izmēģinājuma eksāmens."} Vienreizējs maksājums{" "}
        <strong>{formatEuro(COURSE_PRODUCT.amountCents)}</strong> (ar PVN). 1. modulis — bez maksas.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/iegadaties" className="btn-primary">Iegūt pilnu piekļuvi</Link>
        <Link href="/modulis/M1" className="btn-secondary">Izmēģināt 1. moduli</Link>
      </div>
    </section>
  );
}
