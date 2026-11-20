import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getOrderForUser } from "@/lib/billing/service";
import { SELLER } from "@/config/seller";
import { formatDate, formatEuro } from "@/lib/format";
import { PrintButton } from "@/components/billing/print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rēķins", robots: { index: false } };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/rekins/${id}`);
  const order = await getOrderForUser(id, user.id);
  if (!order || !order.invoiceNumber || !order.paidAt) notFound();
  const b = order.buyer;
  const row = "flex justify-between gap-4 py-1";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <article className="rounded-2xl border border-line bg-white p-6 sm:p-10 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-2xl font-semibold">PVN rēķins Nr. <span className="whitespace-nowrap">{order.invoiceNumber}</span></h1>
            <p className="mt-1 text-sm text-muted">Datums: {formatDate(order.paidAt)}</p>
          </div>
          {order.status === "refunded" && order.refundedAt && (
            <p className="rounded-full bg-err-soft px-3 py-1 text-sm font-semibold text-err">Atmaksāts {formatDate(order.refundedAt)}</p>
          )}
        </header>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Piegādātājs</h2>
            <p className="mt-2 font-semibold">{SELLER.name}</p>
            <p className="text-sm">Reģ. Nr. {SELLER.regNo}</p>
            <p className="text-sm">PVN Nr. {SELLER.vatNo}</p>
            <p className="text-sm">{SELLER.address}</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Pircējs</h2>
            {b.company ? (
              <>
                <p className="mt-2 font-semibold">{b.company}</p>
                {b.regNo && <p className="text-sm">Reģ. Nr. {b.regNo}</p>}
                {b.vatNo && <p className="text-sm">PVN Nr. {b.vatNo}</p>}
                {b.address && <p className="text-sm">{b.address}</p>}
                <p className="text-sm">Kontaktpersona: {b.name}</p>
              </>
            ) : (
              <>
                <p className="mt-2 font-semibold">{b.name}</p>
                {b.address && <p className="text-sm">{b.address}</p>}
              </>
            )}
            <p className="text-sm">{b.email}</p>
          </section>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-muted">
              <th className="py-2 font-semibold">Nosaukums</th>
              <th className="py-2 pl-3 text-right font-semibold">Daudz.</th>
              <th className="hidden py-2 pl-3 text-right font-semibold sm:table-cell">Cena bez PVN</th>
              <th className="py-2 pl-3 text-right font-semibold">Summa bez PVN</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line align-top">
              <td className="py-3 pr-4">{order.product}</td>
              <td className="py-3 pl-3 text-right">1</td>
              <td className="hidden whitespace-nowrap py-3 pl-3 text-right tabular-nums sm:table-cell">{formatEuro(order.netCents)}</td>
              <td className="whitespace-nowrap py-3 pl-3 text-right tabular-nums">{formatEuro(order.netCents)}</td>
            </tr>
          </tbody>
        </table>

        <div className="ml-auto mt-4 max-w-xs text-sm tabular-nums">
          <div className={row}><span>Summa bez PVN</span><span>{formatEuro(order.netCents)}</span></div>
          <div className={row}><span>PVN {order.vatRate} %</span><span>{formatEuro(order.vatCents)}</span></div>
          <div className={`${row} border-t border-line pt-2 text-base font-semibold`}><span>Kopā apmaksai</span><span>{formatEuro(order.amountCents)}</span></div>
        </div>

        <footer className="mt-8 space-y-1 border-t border-line pt-4 text-sm text-muted">
          <p>Apmaksāts {formatDate(order.paidAt)} tiešsaistē ({order.provider === "montonio" ? "bankas maksājums" : order.provider === "stripe" ? "maksājumu karte" : "testa maksājums"}).</p>
          <p>Rēķins sagatavots elektroniski un ir derīgs bez paraksta.</p>
        </footer>
      </article>
    </div>
  );
}
