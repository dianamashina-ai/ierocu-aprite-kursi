import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { COURSE_PRODUCT } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

/** Aicinājums pēc bezmaksas moduļa: turpināt ar pilno kursu. */
export function FullCourseUpsell({ title = "Patīk? Turpini ar pilno kursu", modulesLeft, questionsLeft }: { title?: string; modulesLeft: number; questionsLeft: number }) {
  return (
    <section aria-label="Pilnais kurss" className="flex flex-col gap-5 rounded-2xl bg-ink p-6 text-white sm:p-7 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xl font-semibold tracking-tight">{title}</p>
        <p className="mt-1.5 max-w-lg text-white/70">
          Vēl {modulesLeft} moduļi, {questionsLeft} jautājumi ar skaidrojumiem un izmēģinājuma eksāmens. Vienreizējs maksājums{" "}
          {formatEuro(COURSE_PRODUCT.amountCents)}.
        </p>
      </div>
      <Link href="/iegadaties" className="inline-flex min-h-12 shrink-0 items-center gap-2 self-start rounded-xl bg-white px-5 font-semibold text-ink transition-colors hover:bg-white/90 md:self-auto">
        Iegādāties pilnu kursu <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </section>
  );
}
