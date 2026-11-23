import { Check } from "lucide-react";
import {
  BUNDLE_PRODUCT,
  COURSE_PRODUCT,
  LESSON_INCLUDES,
  LESSON_PRODUCT,
  LESSON_SCHEDULING,
  productByCode,
  splitVat,
  type ProductCode,
} from "@/config/pricing";
import { formatEuro } from "@/lib/format";

const SUBLINE: Partial<Record<ProductCode, string>> = {
  bundle: "Teorija tiešsaistē un prakse šautuvē — viss sagatavošanai.",
  course: "Vienreizējs maksājums, bez abonementa un bez termiņa.",
  lesson: "Mūsu šautuvē ar sertificētu instruktoru.",
};

/**
 * Produkta kartīte — vienāda sākumlapas cenās un pirkuma lapā.
 * Komplekts — melns, pārējie — balti. `action` — poga apakšā (nav obligāta); `className` — izmēri slīdnī u. tml.
 */
export function ProductCard({
  code,
  courseItems,
  action,
  className = "",
  showVat = false,
}: {
  code: ProductCode;
  /** Kas iekļauts kursā (courseIncluded) */
  courseItems: string[];
  action?: React.ReactNode;
  className?: string;
  /** Rādīt PVN summu (pirkuma lapā) */
  showVat?: boolean;
}) {
  const p = productByCode(code);
  const dark = code === "bundle";
  const saving = COURSE_PRODUCT.amountCents + LESSON_PRODUCT.amountCents - BUNDLE_PRODUCT.amountCents;
  const items = code === "bundle" ? ["Viss, kas iekļauts mācību kursā", ...LESSON_INCLUDES] : [...(p.includesCourse ? courseItems : []), ...(p.includesLesson ? LESSON_INCLUDES : [])];
  const muted = dark ? "text-white/70" : "text-muted";
  const { vatCents: vat } = splitVat(p.amountCents, p.vatRate);

  return (
    <article className={`flex flex-col rounded-2xl p-6 sm:p-8 ${dark ? "bg-ink text-white" : "border border-line bg-white"} ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={`text-sm ${muted}`}>{p.title}</h3>
        {code === "bundle" && (
          <span className="rounded-full bg-ok px-3 py-1 text-xs font-semibold text-white">Ietaupi {formatEuro(saving)}</span>
        )}
      </div>
      <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums">{formatEuro(p.amountCents)}</p>
      <p className={`mt-2 text-sm ${muted}`}>
        {SUBLINE[code]}
        {showVat && (
          <>
            {" "}
            T. sk. PVN {p.vatRate} % — {formatEuro(vat)}.
          </>
        )}
      </p>
      <ul className="mt-6 space-y-3">
        {items.map((x) => (
          <li key={x} className="flex gap-3">
            <Check aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${dark ? "text-white" : "text-ok"}`} strokeWidth={2.5} />
            <span>{x}</span>
          </li>
        ))}
      </ul>
      {p.includesLesson && <p className={`mt-6 text-sm ${muted}`}>{LESSON_SCHEDULING}</p>}
      {action && <div className="mt-auto pt-8">{action}</div>}
    </article>
  );
}
