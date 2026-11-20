import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboard } from "@/lib/progress/service";
import { topicSlug } from "@/lib/content/queries";
import { ProgressBar } from "@/components/progress-bar";
import { formatDate, formatDateTime, formatEuro, plural } from "@/lib/format";
import { READY_TOPIC_PERCENT } from "@/lib/progress/readiness";
import { hasFullAccess } from "@/lib/billing/access";
import { getOrdersForUser } from "@/lib/billing/service";
import { Paywall } from "@/components/billing/paywall";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panelis" };

function Stat({ value, label, href }: { value: React.ReactNode; label: string; href?: string }) {
  const body = (
    <>
      <span className="block text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-xl border border-line bg-white p-4 hover:border-accent">{body}</Link>
  ) : (
    <div className="rounded-xl border border-line bg-white p-4">{body}</div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser("/panelis");
  const [d, access, orders] = await Promise.all([getDashboard(user.id), hasFullAccess(user.id), getOrdersForUser(user.id)]);
  const invoices = orders.filter((o) => o.invoiceNumber);
  const masteredPct = Math.round((d.masteredQuestions / d.totalQuestions) * 100);
  const started = d.answeredQuestions > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Sveiks{user.name ? `, ${user.name}` : ""}!</h1>
      {!access && (
        <div className="mt-6">
          <Paywall title="Tev pieejams 1. modulis">Atver pārējos 8 moduļus, visas nodarbības, skaidrojumus un izmēģinājuma eksāmenu.</Paywall>
        </div>
      )}

      <section
        aria-labelledby="ready-h"
        className={`mt-6 rounded-2xl border-2 p-5 ${d.readiness.ready ? "border-ok bg-ok-soft" : "border-line bg-white"}`}
      >
        <h2 id="ready-h" className="text-lg font-semibold">
          {d.readiness.ready ? "Gatavs eksāmenam" : "Ceļš līdz gatavībai"}
        </h2>
        {d.readiness.ready ? (
          <p className="mt-1">Pēdējie 3 izmēģinājuma eksāmeni nokārtoti, un visas tēmas apgūtas vismaz par {READY_TOPIC_PERCENT} %.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex gap-2">
              <span aria-hidden="true">{d.readiness.examsPassed === 3 ? "✓" : "○"}</span>
              Pēdējie 3 izmēģinājuma eksāmeni nokārtoti: {d.readiness.examsPassed} no 3
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">{d.readiness.topicsBelow.length === 0 ? "✓" : "○"}</span>
              Tēmas apgūtas vismaz par {READY_TOPIC_PERCENT} %: {37 - d.readiness.topicsBelow.length} no 37
            </li>
          </ul>
        )}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={`${masteredPct} %`} label={`apgūti (${d.masteredQuestions} no ${d.totalQuestions})`} />
        <Stat value={d.unanswered} label="vēl nav atbildēti" />
        <Stat value={plural(d.streak, "diena", "dienas", "dienu")} label="sērija pēc kārtas" />
        <Stat value={d.dueReviews} label="kļūdas jāatkārto šodien" href="/kludas" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {d.dueReviews > 0 && <Link href="/kludas" className="btn-primary">Atkārtot kļūdas ({d.dueReviews})</Link>}
        <Link href="/eksamens" className={d.dueReviews > 0 ? "btn-secondary" : "btn-primary"}>Izmēģinājuma eksāmens</Link>
        {!started && <Link href="/modulis/M1" className="btn-secondary">Sākt ar 1. moduli</Link>}
      </div>

      {d.weakTopics.length > 0 && (
        <section className="mt-10" aria-labelledby="weak-h">
          <h2 id="weak-h" className="text-xl font-semibold">Vājās tēmas</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {d.weakTopics.map((t) => (
              <li key={t.id} className="rounded-xl border border-line bg-white p-4">
                <p className="text-sm text-muted">Tēma {t.id}</p>
                <p className="font-semibold">{t.title}</p>
                <p className="mt-1 text-sm text-err">Pareizi {Math.round((t.accuracy ?? 0) * 100)} % no atbildētajiem</p>
                <Link href={`/tema/${topicSlug(t.id)}/trenins`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-accent-strong underline underline-offset-4">
                  Trenēties
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="mods-h">
        <h2 id="mods-h" className="text-xl font-semibold">Progress pa moduļiem</h2>
        <p className="mt-1 text-sm text-muted">Apgūts = pēdējā atbilde uz jautājumu bija pareiza.</p>
        <ol className="mt-4 space-y-3">
          {d.modules.map((m) => (
            <li key={m.id} className="rounded-xl border border-line bg-white">
              <details>
                <summary className="flex min-h-14 cursor-pointer list-none flex-col gap-2 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold"><span className="text-accent">{m.order}.</span> {m.title}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted">{m.percent} %</span>
                  </span>
                  <ProgressBar percent={m.percent} label={`${m.title}: ${m.percent} %`} />
                </summary>
                <ul className="space-y-3 border-t border-line p-4">
                  {m.topics.map((t) => (
                    <li key={t.id}>
                      <Link href={`/tema/${topicSlug(t.id)}`} className="block rounded-lg p-1 hover:bg-accent-soft">
                        <span className="flex items-baseline justify-between gap-3 text-sm">
                          <span><span className="text-muted">{t.id}</span> {t.title}</span>
                          <span className={`shrink-0 tabular-nums ${t.percent >= READY_TOPIC_PERCENT ? "text-ok" : "text-muted"}`}>
                            {t.mastered}/{t.total}
                          </span>
                        </span>
                        <span className="mt-1 block">
                          <ProgressBar percent={t.percent} label={`${t.title}: ${t.percent} %`} tone={t.percent >= READY_TOPIC_PERCENT ? "ok" : "accent"} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10" aria-labelledby="ex-h">
        <h2 id="ex-h" className="text-xl font-semibold">Izmēģinājuma eksāmeni</h2>
        {d.exams.length === 0 ? (
          <p className="mt-2 text-muted">Vēl nav neviena. Kad jūties gatavs, izmēģini — tas aizņem līdz stundai.</p>
        ) : (
          <ol className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
            {d.exams.slice(0, 5).map((e) => (
              <li key={e.id}>
                <Link href={`/eksamens/${e.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent-soft">
                  <span className="text-sm">{formatDateTime(e.finishedAt!)}</span>
                  <span className="tabular-nums">{e.correctCount}/{e.questionIds.length}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.passed ? "bg-ok-soft text-ok" : "bg-err-soft text-err"}`}>
                    {e.passed ? "Nokārtots" : "Nav nokārtots"}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
      {invoices.length > 0 && (
        <section className="mt-12" aria-labelledby="inv-h">
          <h2 id="inv-h" className="text-xl font-semibold">Rēķini</h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
            {invoices.map((o) => (
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
        </section>
      )}
    </div>
  );
}
