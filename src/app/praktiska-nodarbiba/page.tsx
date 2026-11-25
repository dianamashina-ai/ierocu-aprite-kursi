import Link from "next/link";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFullAccess } from "@/lib/billing/access";
import { getOrdersForUser } from "@/lib/billing/service";
import { courseIncluded } from "@/lib/billing/included";
import { getCourseOverview } from "@/lib/content/queries";
import { ProductCard } from "@/components/billing/product-card";
import { BUNDLE_PRODUCT, buyPath, COURSE_PRODUCT, LESSON_CODES, LESSON_PRODUCT, LESSON_SCHEDULING, type ProductCode } from "@/config/pricing";
import { formatEuro, formatLessonAt } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Praktiskā nodarbība šautuvē",
  description: "Iepazīšanās ar kaujas ieroci un 30 izmēģinājuma šāvieni ar sertificētu instruktoru mūsu šautuvē.",
};

/** Praktiskā nodarbība: apraksts, iegādātās nodarbības statuss un iespēja iegādāties (arī tiem, kam jau ir kurss). */
export default async function LessonPage() {
  const [user, course] = await Promise.all([getCurrentUser(), getCourseOverview()]);
  const [hasCourse, orders] = await Promise.all([hasFullAccess(user?.id), user ? getOrdersForUser(user.id) : Promise.resolve([])]);
  const lessons = orders.filter((o) => o.status === "paid" && LESSON_CODES.includes(o.productCode as ProductCode));
  const saving = COURSE_PRODUCT.amountCents + LESSON_PRODUCT.amountCents - BUNDLE_PRODUCT.amountCents;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-4xl font-semibold tracking-tight">Praktiskā nodarbība šautuvē</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Iepazīšanās ar kaujas ieroci un 30 izmēģinājuma šāvieni ar sertificētu instruktoru mūsu šautuvē. Nodarbība nav obligāta
        ieroču atļaujas saņemšanai, bet palīdz justies drošāk, pirmo reizi turot ieroci rokās.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
        <ProductCard
          code="lesson"
          courseItems={courseIncluded(course.totals, { questions: 40, minutes: 40 })}
          gray
          headingLevel={2}
          showVat
          action={
            <Link href={buyPath("lesson")} className="btn-primary w-full sm:w-auto">
              Iegādāties nodarbību
            </Link>
          }
        />

        <div className="space-y-6">
          {lessons.length > 0 && (
            <section aria-labelledby="mine-h" className="rounded-2xl border border-line bg-white p-6">
              <h2 id="mine-h" className="text-xl font-semibold">
                Tavas nodarbības
              </h2>
              <ul className="mt-4 space-y-4">
                {lessons.map((o) => (
                  <li key={o.id} className="flex items-start gap-3">
                    {o.lessonStatus === "scheduled" ? (
                      <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-strong" />
                    ) : (
                      <CheckCircle2 aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${o.lessonStatus === "done" ? "text-ok" : "text-muted"}`} />
                    )}
                    <span>
                      {o.lessonStatus === "refunded" ? (
                        <span className="font-semibold">Atcelta — nauda atmaksāta</span>
                      ) : o.lessonStatus === "done" ? (
                        <span className="font-semibold">Notikusi{o.lessonAt ? ` — ${formatLessonAt(o.lessonAt)}` : ""}</span>
                      ) : o.lessonStatus === "scheduled" && o.lessonAt ? (
                        <span className="font-semibold">Saskaņota: {formatLessonAt(o.lessonAt)}</span>
                      ) : (
                        <span className="font-semibold">Iegādāta — laiks vēl jāsaskaņo</span>
                      )}
                      {o.lessonStatus !== "done" && o.lessonStatus !== "refunded" && (
                        <span className="block text-sm text-muted">
                          {o.lessonStatus === "scheduled" ? "Ja laiks jāmaina, atbildi uz apstiprinājuma e-pastu." : LESSON_SCHEDULING}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!hasCourse && (
            <section aria-labelledby="bundle-h" className="rounded-2xl bg-ink p-6 text-white">
              <h2 id="bundle-h" className="text-xl font-semibold">
                Vēl nav kursa?
              </h2>
              <p className="mt-2 text-white/70">
                Kurss + praktiskā nodarbība kopā — {formatEuro(BUNDLE_PRODUCT.amountCents)}. Ietaupi {formatEuro(saving)}.
              </p>
              <Link
                href={buyPath("bundle")}
                className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-white px-5 font-semibold text-ink transition-colors hover:bg-white/90"
              >
                Iegādāties komplektu
              </Link>
            </section>
          )}

          <section aria-labelledby="how-h" className="rounded-2xl border border-line bg-white p-6">
            <h2 id="how-h" className="text-xl font-semibold">
              Kā tas notiek
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted marker:font-semibold marker:text-accent-strong">
              <li>Iegādājies nodarbību un norādi tālruni.</li>
              <li>Administrators ar tevi sazinās un saskaņo datumu un laiku.</li>
              <li>Saņem apstiprinājumu e-pastā un ierodies šautuvē.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
