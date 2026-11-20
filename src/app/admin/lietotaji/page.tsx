import Link from "next/link";
import { listUsers } from "@/lib/backoffice/service";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Lietotāji" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.slice(0, 100) ?? "";
  const rows = await listUsers({ q });

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Lietotāji</h1>
        <form className="flex gap-2" role="search">
          <label htmlFor="users-q" className="sr-only">Meklēt lietotāju</label>
          <input
            id="users-q"
            name="q"
            defaultValue={q}
            placeholder="E-pasts vai vārds"
            className="min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-accent focus:outline-none sm:w-72"
          />
          <button className="btn-secondary min-h-10 px-4 text-sm">Meklēt</button>
        </form>
      </div>
      <p className="mt-2 text-sm text-muted">Rāda pēdējos 100{q ? " atrastos" : ""} lietotājus, jaunākie augšā.</p>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-white p-6 text-muted">Nekas nav atrasts.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">E-pasts</th>
                <th className="px-5 py-3 font-semibold">Reģistrējies</th>
                <th className="px-5 py-3 font-semibold">Piekļuve</th>
                <th className="px-5 py-3 text-right font-semibold">Atbildes</th>
                <th className="px-5 py-3 font-semibold">Pēdējā aktivitāte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="max-w-72 px-5 py-3">
                    <span className="block truncate">{u.email}</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
