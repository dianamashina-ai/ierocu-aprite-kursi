import Link from "next/link";
import { listTestAccounts, listUsers } from "@/lib/backoffice/service";
import { TestAccountsCleanup } from "@/components/admin/test-accounts-cleanup";
import { formatDate } from "@/lib/format";
import { UsersToolbar } from "@/components/admin/users-toolbar";
import { SHARING_DEVICE_THRESHOLD } from "@/lib/auth/devices";

export const metadata = { title: "Lietotāji" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; aizdomas?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.slice(0, 100) ?? "";
  const [all, tests] = await Promise.all([listUsers({ q }), listTestAccounts()]);
  const onlyShared = sp.aizdomas === "1";
  const rows = onlyShared ? all.filter((u) => u.possiblyShared) : all;

  return (
    <>
      <UsersToolbar q={q} onlyShared={onlyShared} threshold={SHARING_DEVICE_THRESHOLD} />

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-white p-6 text-muted">Nekas nav atrasts.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">E-pasts</th>
                <th className="px-5 py-3 font-semibold">Reģistrējies</th>
                <th className="px-5 py-3 font-semibold">Piekļuve</th>
                <th className="px-5 py-3 text-right font-semibold">Atbildes</th>
                <th className="px-5 py-3 font-semibold">Pēdējā aktivitāte</th>
                <th className="px-5 py-3 text-right font-semibold">Ierīces (30 d.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="max-w-72 px-5 py-3">
                    <Link href={`/admin/lietotaji/${u.id}`} className="block truncate font-semibold underline-offset-2 hover:underline">{u.email}</Link>
                    {u.name && u.name !== u.email.split("@")[0] && <span className="block truncate text-xs text-muted">{u.name}</span>}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    {u.access ? (
                      <Link href={`/admin/pasutijumi?q=${encodeURIComponent(u.email)}`} className="font-semibold text-ok underline-offset-2 hover:underline">Pilna</Link>
                    ) : (
                      <span className="text-muted">1. modulis</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{u.answers}</td>
                  <td className="px-5 py-3 tabular-nums text-muted">{u.lastActive ? formatDate(u.lastActive) : "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {u.possiblyShared ? (
                      <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn">{u.devices30d} · koplietošana?</span>
                    ) : (
                      u.devices30d
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TestAccountsCleanup
        rows={tests.map((t) => ({ id: t.id, email: t.email, created: formatDate(t.createdAt), orders: t.orders, invoiced: t.invoiced }))}
      />
    </>
  );
}
