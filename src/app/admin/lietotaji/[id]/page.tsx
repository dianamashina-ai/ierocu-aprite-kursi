import Link from "next/link";
import { isProductCode, PRODUCTS } from "@/config/pricing";
import { notFound } from "next/navigation";
import { adminStatus } from "@/lib/admin";
import { getUserDetail } from "@/lib/backoffice/service";
import { describeDevice } from "@/lib/backoffice/user-agent";
import { formatDate, formatDateTime, formatEuro } from "@/lib/format";
import { MAX_DEVICES, SHARING_DEVICE_THRESHOLD } from "@/lib/auth/devices";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { RefundButton } from "@/components/admin/refund-button";
import { GrantAccessForm } from "@/components/admin/grant-access-form";
import { SignOutAllButton } from "@/components/admin/sign-out-all-button";
import { DeleteAccountButton } from "@/components/admin/delete-account-button";
import { RefundLessonButton } from "@/components/admin/refund-lesson-button";
import { lessonPartCents } from "@/lib/billing/service";

export const metadata = { title: "Lietotājs" };

const box = "rounded-2xl border border-line bg-white";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const d = await getUserDetail((await params).id);
  if (!d) notFound();
  const { user: u } = d;
  const adminInfo = adminStatus({ email: u.email, emailVerified: Boolean(u.emailVerified) });

  return (
    <>
      <Link href="/admin/lietotaji" className="text-sm font-semibold text-accent-strong underline underline-offset-4">← Uz lietotājiem</Link>
      <h1 className="mt-4 break-all text-3xl font-semibold tracking-tight">{u.email}</h1>
      <p className="mt-2 text-sm text-muted">
        {u.name} · reģistrējies {formatDate(u.createdAt)} · atbildes: {d.answers} ·{" "}
        {d.access ? <span className="font-semibold text-ok">pilna piekļuve</span> : "tikai 1. modulis"} · e-pasts{" "}
        {u.emailVerified ? <span className="font-semibold text-ok">apstiprināts</span> : <span className="font-semibold text-warn">nav apstiprināts</span>}
        {adminInfo !== "not-listed" && (
          <>
            {" "}· administrators:{" "}
            {adminInfo === "admin" ? (
              <span className="font-semibold text-ok">jā</span>
            ) : (
              <span className="font-semibold text-warn">nē — e-pasts nav apstiprināts</span>
            )}
          </>
        )}
      </p>

      {d.possiblyShared && (
        <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          Pēdējās 30 dienās konts izmantots <strong>{d.devices30d} dažādās ierīcēs</strong> (parasti ne vairāk par {SHARING_DEVICE_THRESHOLD}). Iespējams,
          kontu izmanto vairākas personas. Vari izrakstīt no visām ierīcēm vai atsaukt piekļuvi.
        </p>
      )}

      <section className="mt-8" aria-labelledby="orders-h">
        <h2 id="orders-h" className="text-xl font-semibold">Piekļuve un pasūtījumi</h2>
        {!d.access && (
          <div className="mt-4">
            <GrantAccessForm defaultEmail={u.email} />
          </div>
        )}
        {d.orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Pasūtījumu nav.</p>
        ) : (
          <ul className={`mt-4 divide-y divide-line ${box}`}>
            {d.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm">
                <span className="w-36 tabular-nums text-muted">{formatDateTime(o.createdAt)}</span>
                <span className="min-w-0 flex-1">
                  {o.invoiceNumber ? (
                    <Link href={`/rekins/${o.id}`} className="underline underline-offset-2">{o.invoiceNumber}</Link>
                  ) : (
                    (o.note ?? "bez rēķina")
                  )}
                  <span className="text-muted">
                    {" · "}
                    {isProductCode(o.productCode) ? PRODUCTS[o.productCode].title : o.product}
                    {o.buyer.phone ? ` · ${o.buyer.phone}` : ""}
                  </span>
                </span>
                <span className="tabular-nums">
                  {formatEuro(o.amountCents)}
                  {o.status === "paid" && o.refundedCents > 0 && <span className="ml-1 text-xs text-err">(atmaksāti {formatEuro(o.refundedCents)})</span>}
                </span>
                <OrderStatusBadge status={o.status} provider={o.provider} />
                {o.status === "paid" && (
                  <RefundButton orderId={o.id} label={formatEuro(o.amountCents - o.refundedCents)} revoke={o.provider === "manual"} />
                )}
                {o.status === "paid" && o.productCode === "bundle" && o.lessonStatus !== "refunded" && o.lessonStatus !== "done" && (
                  <RefundLessonButton orderId={o.id} label={formatEuro(lessonPartCents())} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="dev-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="dev-h" className="text-xl font-semibold">
            Ierīces <span className="text-base font-normal text-muted">· aktīvas {d.sessions.length} no {MAX_DEVICES}</span>
          </h2>
          {d.sessions.length > 0 && <SignOutAllButton userId={u.id} />}
        </div>
        {d.sessions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Pašlaik nav pieslēgts nevienā ierīcē.</p>
        ) : (
          <ul className={`mt-4 divide-y divide-line ${box}`}>
            {d.sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap gap-x-4 px-5 py-3 text-sm">
                <span className="font-semibold">{describeDevice(s.userAgent)}</span>
                <span className="text-muted">pieslēdzās {formatDateTime(s.createdAt)}</span>
                {s.ipAddress && <span className="tabular-nums text-muted">IP {s.ipAddress}</span>}
              </li>
            ))}
          </ul>
        )}

        <h3 className="mt-8 font-semibold">Pieslēgšanās vēsture <span className="font-normal text-muted">· {d.devices30d} ierīces 30 dienās</span></h3>
        {d.logins.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Ierakstu nav.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {d.logins.map((l) => (
              <li key={l.id} className="flex flex-wrap gap-x-4 text-muted">
                <span className="w-36 tabular-nums">{formatDateTime(l.createdAt)}</span>
                <span className="text-ink">{describeDevice(l.userAgent)}</span>
                {l.ipAddress && <span className="tabular-nums">IP {l.ipAddress}</span>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">Vēsture tiek glabāta 90 dienas.</p>
      </section>
      <section className="mt-12 border-t border-line pt-6" aria-labelledby="del-h">
        <h2 id="del-h" className="text-xl font-semibold">Dzēst kontu</h2>
        <p className="mt-1 text-sm text-muted">Testa kontiem pirms palaišanas. Dzēš kontu, progresu, ierīces un pasūtījumus.</p>
        <div className="mt-4">
          {adminInfo === "admin" ? (
            <p className="text-sm text-muted">Administratora kontu dzēst nevar.</p>
          ) : (
            <DeleteAccountButton userId={u.id} email={u.email} />
          )}
        </div>
      </section>
    </>
  );
}
