import Link from "next/link";
import { isProductCode, PRODUCTS } from "@/config/pricing";
import { listOrders, type OrderStatus } from "@/lib/backoffice/service";
import { formatDateTime, formatEuro } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { RefundButton } from "@/components/admin/refund-button";

export const metadata = { title: "Pasūtījumi" };

const TABS: { status?: OrderStatus; label: string }[] = [
  { label: "Visi" },
  { status: "paid", label: "Apmaksāti" },
  { status: "refunded", label: "Atmaksāti" },
  { status: "pending", label: "Gaida apmaksu" },
];
const PROVIDER: Record<string, string> = { stripe: "Stripe", montonio: "Montonio", dev: "Tests", manual: "Manuāli" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = TABS.find((t) => t.status === sp.status)?.status;
  const q = sp.q?.slice(0, 100) ?? "";
  const rows = await listOrders({ status, q });
  const href = (s?: OrderStatus) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    return `/admin/pasutijumi${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Pasūtījumi</h1>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <Link
              key={t.label}
              href={href(t.status)}
              aria-current={t.status === status ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm ${t.status === status ? "bg-accent-soft font-semibold" : "text-muted hover:bg-accent-soft hover:text-ink"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="orders-q" className="sr-only">Meklēt pasūtījumu</label>
          <input
            id="orders-q"
            name="q"
            defaultValue={q}
            placeholder="E-pasts, vārds vai rēķina Nr."
            className="min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm sm:w-72"
          />
          <button className="btn-secondary min-h-10 px-4 text-sm">Meklēt</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-white p-6 text-muted">Nekas nav atrasts.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
          {rows.map(({ order: o, email }) => (
            <li key={o.id} className="grid gap-2 px-5 py-4 text-sm lg:grid-cols-[9rem_minmax(0,1fr)_6rem_7rem_minmax(0,14rem)] lg:items-center lg:gap-4">
              <span className="tabular-nums text-muted">{formatDateTime(o.createdAt)}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{o.buyer.name}</span>
                <span className="block truncate">
                  {isProductCode(o.productCode) ? PRODUCTS[o.productCode].title : o.product}
                  {o.buyer.phone && (
                    <>
                      {" · "}
                      <a href={`tel:${o.buyer.phone.replace(/\s/g, "")}`} className="font-semibold underline underline-offset-2">
                        {o.buyer.phone}
                      </a>
                    </>
                  )}
                </span>
                <Link href={`/admin/lietotaji/${o.userId}`} className="block truncate text-muted underline-offset-2 hover:text-ink hover:underline">{email}</Link>
                <span className="block text-xs text-muted">
                  {o.invoiceNumber ? (
                    <Link href={`/rekins/${o.id}`} className="underline underline-offset-2 hover:text-ink">{o.invoiceNumber}</Link>
                  ) : (
                    "bez rēķina"
                  )}{" "}
                  · {o.provider === "manual" ? (o.note ?? "Manuāli") : (PROVIDER[o.provider] ?? o.provider)}
                </span>
              </span>
              <span className="tabular-nums">{formatEuro(o.amountCents)}</span>
              <span><OrderStatusBadge status={o.status} provider={o.provider} /></span>
              <span>{o.status === "paid" && <RefundButton orderId={o.id} label={formatEuro(o.amountCents)} revoke={o.provider === "manual"} />}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">Atmaksa notiek maksājumu sistēmā; pēc tam piekļuve tiek slēgta un pircējam nosūtīts e-pasts.</p>
    </>
  );
}
