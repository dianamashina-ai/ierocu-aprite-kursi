import Link from "next/link";
import { COURSE_ACCESS_CODES, LESSON_CODES, LESSON_SCHEDULING, type ProductCode } from "@/config/pricing";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { hasFullAccess } from "@/lib/billing/access";
import { getOrdersForUser } from "@/lib/billing/service";
import { formatDate, formatEuro, formatLessonAt } from "@/lib/format";
import { Paywall } from "@/components/billing/paywall";
import { SignOutButton } from "@/components/sign-out-button";
import { EmailForm, NameForm, PasswordForm } from "@/components/account/account-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profils" };

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-t border-line py-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-10">
      <div>
        <h2 id={id} className="text-lg font-semibold">{title}</h2>
        {lead && <p className="mt-1 text-sm text-muted">{lead}</p>}
      </div>
      <div className="max-w-xl">{children}</div>
    </section>
  );
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ epasts?: string }> }) {
  const user = await requireUser("/konts");
  const [{ epasts }, access, orders] = await Promise.all([searchParams, hasFullAccess(user.id), getOrdersForUser(user.id)]);
  const paid = orders.filter((o) => o.invoiceNumber);
  const lessons = orders.filter((o) => o.status === "paid" && LESSON_CODES.includes(o.productCode as ProductCode));
  const activeSince = orders.find((o) => o.status === "paid" && COURSE_ACCESS_CODES.includes(o.productCode as ProductCode))?.paidAt;

  return (
    <div className="page-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-4xl font-semibold tracking-tight">Profils</h1>
        <p className="mt-3 text-muted">Profila dati, pieslēgšanās un pirkumi.</p>

        {epasts === "mainits" && (
          <p role="status" className="mt-6 rounded-lg bg-ok-soft px-4 py-3 text-sm text-ok">E-pasta adrese nomainīta.</p>
        )}

        <div className="mt-10">
          <Section id="profile-h" title="Personīgie dati" lead="Vārds un uzvārds tiek rādīts tikai tev.">
            <NameForm name={user.name} />
          </Section>

          <Section id="email-h" title="E-pasts" lead="Uz šo adresi sūtām pieslēgšanās saites un rēķinus.">
            <EmailForm email={user.email} />
          </Section>

          <Section id="pw-h" title="Parole">
            <PasswordForm />
          </Section>

          <Section id="access-h" title="Piekļuve">
            {access ? (
              <p className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok" />
                <span>
                  <span className="font-semibold">Pilna piekļuve</span>
                  {activeSince && <span className="block text-sm text-muted">kopš {formatDate(activeSince)}</span>}
                </span>
              </p>
            ) : (
              <Paywall title="Tev pieejams 1. modulis">Atver pārējos 8 moduļus, visas nodarbības, skaidrojumus un izmēģinājuma eksāmenu.</Paywall>
            )}
            {paid.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold">Rēķini</h3>
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
                  {paid.map((o) => (
                    <li key={o.id}>
                      <Link href={`/rekins/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent-soft">
                        <span className="font-semibold">{o.invoiceNumber}</span>
                        <span className="text-sm text-muted">{formatDate(o.paidAt!)}</span>
                        <span className="tabular-nums">{formatEuro(o.amountCents)}</span>
                        {o.status === "refunded" && <span className="text-xs font-semibold text-err">atmaksāts</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Section>

          {lessons.length > 0 && (
            <Section id="lesson-h" title="Praktiskā nodarbība">
              <ul className="space-y-3">
                {lessons.map((o) => (
                  <li key={o.id} className="flex items-start gap-2">
                    <CheckCircle2 aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${o.lessonStatus === "done" ? "text-ok" : "text-muted"}`} />
                    <span>
                      {o.lessonStatus === "done" ? (
                        <span className="font-semibold">Notikusi{o.lessonAt ? ` — ${formatLessonAt(o.lessonAt)}` : ""}</span>
                      ) : o.lessonStatus === "scheduled" && o.lessonAt ? (
                        <span className="font-semibold">Saskaņota: {formatLessonAt(o.lessonAt)}</span>
                      ) : (
                        <span className="font-semibold">Iegādāta — laiks vēl jāsaskaņo</span>
                      )}
                      {o.lessonStatus !== "done" && (
                        <span className="block text-sm text-muted">
                          {o.lessonStatus === "scheduled" ? "Ja laiks jāmaina, atbildi uz apstiprinājuma e-pastu." : LESSON_SCHEDULING}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section id="out-h" title="Iziet">
            <SignOutButton className="btn-secondary" />
          </Section>
        </div>
      </div>
    </div>
  );
}
