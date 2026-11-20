import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { listNotes } from "@/lib/notes/service";
import { deleteNoteAction, setNoteStatusAction } from "@/app/actions/notes";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Labojumi", robots: { index: false } };

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser("/labojumi");
  if (!isAdmin(user)) notFound();
  const status = (await searchParams).status === "done" ? "done" : "open";
  const notes = await listNotes(status);
  const tab = (s: string, label: string) => (
    <Link
      href={s === "open" ? "/labojumi" : "/labojumi?status=done"}
      aria-current={status === s ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold ${status === s ? "bg-accent-soft text-accent" : "hover:bg-accent-soft"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Labojumi</h1>
      <p className="mt-2 text-muted">
        Piezīmes par dizainu. Lai pievienotu jaunu, atver jebkuru lapu, nospied pogu <strong>Labot</strong> labajā apakšējā stūrī un noklikšķini uz elementa.
      </p>
      <div className="mt-6 flex gap-1">
        {tab("open", "Atvērtie")}
        {tab("done", "Izdarītie")}
      </div>

      {notes.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-white p-6 text-muted">{status === "open" ? "Atvērtu piezīmju nav." : "Vēl nekas nav atzīmēts kā izdarīts."}</p>
      ) : (
        <ol className="mt-6 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <Link href={n.path} className="font-semibold text-accent underline underline-offset-2">{n.path}</Link>
                <span>{n.viewportWidth < 768 ? "📱" : "🖥"} {n.viewportWidth}×{n.viewportHeight}</span>
                <span>{formatDateTime(n.createdAt)}</span>
              </div>
              {n.elementText && <p className="mt-2 line-clamp-2 rounded-lg bg-surface px-3 py-2 text-sm text-muted">«{n.elementText}»</p>}
              <p className="mt-3 whitespace-pre-wrap text-[16px]">{n.comment}</p>
              {n.reply && <p className="mt-3 rounded-lg bg-ok-soft px-3 py-2 text-sm">↳ {n.reply}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={setNoteStatusAction.bind(null, n.id, n.status === "open" ? "done" : "open")}>
                  <button type="submit" className="btn-secondary min-h-10 px-3 text-sm">{n.status === "open" ? "Atzīmēt kā izdarītu" : "Atvērt atkal"}</button>
                </form>
                <form action={deleteNoteAction.bind(null, n.id)}>
                  <button type="submit" className="min-h-10 rounded-xl px-3 text-sm text-err hover:bg-err-soft">Dzēst</button>
                </form>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
