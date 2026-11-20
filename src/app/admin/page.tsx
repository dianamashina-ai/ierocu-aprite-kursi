import Link from "next/link";
import { getStats, listOrders } from "@/lib/backoffice/service";
import { formatDateTime, formatEuro } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { activeProviderName } from "@/lib/billing/service";

export const metadata = { title: "Pārskats" };

function Stat({ value, label, href }: { value: React.ReactNode; label: string; href?: string }) {
  const body = (
    <>
      <p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-2xl border border-line bg-white p-5 transition-colors hover:border-accent">{body}</Link>
  ) : (
    <div className="rounded-2xl border border-line bg-white p-5">{body}</div>
  );
}

export default async function AdminHome() {
  const [s, recent] = await Promise.all([getStats(), listOrders({ limit: 8 })]);
  const provider = activeProviderName();
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Pārskats</h1>
      {provider === "dev" && (
        <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          Ieslēgti <strong>testa maksājumi</strong> — īstu maksājumu vēl nav. Pirms palaišanas jāpieslēdz Stripe vai Montonio.
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={formatEuro(s.revenueCents)} label="ieņēmumi tiešsaistē (ar PVN)" href="/admin/pasutijumi?status=paid" />
        <Stat value={s.paid} label="apmaksāti tiešsaistē" href="/admin/pasutijumi?status=paid" />
        <Stat value={s.users} label={`lietotāji (+${s.newUsers} šonedēļ)`} href="/admin/lietotaji" />
        <Stat value={`${s.reviewed} / ${s.reviewed + s.draft}`} label="skaidrojumi pārbaudīti" href="/admin/skaidrojumi?status=draft" />
      </div>
      {(s.refunded > 0 || s.pending > 0 || s.manual > 0) && (
        <p className="mt-3 text-sm text-muted">
          Atmaksāti: {s.refunded} · Gaida apmaksu: {s.pending} · Piešķirti manuāli: {s.manual}
        </p>
      )}

      <div className="mt-10 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">Pēdējie pasūtījumi</h2>
        <Link href="/admin/pasutijumi" className="text-sm font-semibold text-accent-strong underline underline-offset-4">Visi pasūtījumi</Link>
      </div>
      {recent.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-white p-6 text-muted">Pasūtījumu vēl nav.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
          {recent.map(({ order: o, email }) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
              <span className="w-36 tabular-nums text-muted">{formatDateTime(o.createdAt)}</span>
              <span className="min-w-0 flex-1 truncate">{o.buyer.name} · {email}</span>
              <span className="tabular-nums">{formatEuro(o.amountCents)}</span>
              <OrderStatusBadge status={o.status} provider={o.provider} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
