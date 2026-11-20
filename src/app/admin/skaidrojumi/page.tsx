import Link from "next/link";
import { listModules, listQuestionsForReview, type ExplanationStatus } from "@/lib/backoffice/service";
import { ExplanationBadge } from "@/components/admin/status-badge";

export const metadata = { title: "Skaidrojumi" };

const TABS: { status?: ExplanationStatus; label: string }[] = [
  { label: "Visi" },
  { status: "draft", label: "Jāpārbauda" },
  { status: "reviewed", label: "Pārbaudīti" },
];

export default async function ExplanationsPage({ searchParams }: { searchParams: Promise<{ status?: string; modulis?: string }> }) {
  const sp = await searchParams;
  const status = TABS.find((t) => t.status === sp.status)?.status;
  const modules = await listModules();
  const moduleId = modules.find((m) => m.id === sp.modulis)?.id;
  const rows = await listQuestionsForReview({ status, moduleId });
  const href = (s?: ExplanationStatus, m?: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (m) p.set("modulis", m);
    return `/admin/skaidrojumi${p.size ? `?${p}` : ""}`;
  };
  const qs = (() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (moduleId) p.set("modulis", moduleId);
    return p.size ? `?${p}` : "";
  })();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Skaidrojumi</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Pārbaudīts skaidrojums netiek pārrakstīts, atjauninot saturu no repozitorija. Melnraksti ir redzami skolēniem, bet vēl nav
        pārbaudīti.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <Link
              key={t.label}
              href={href(t.status, moduleId)}
              aria-current={t.status === status ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm ${t.status === status ? "bg-accent-soft font-semibold" : "text-muted hover:bg-accent-soft hover:text-ink"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <Link href={href(status)} aria-current={!moduleId ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm ${!moduleId ? "bg-accent-soft font-semibold" : "text-muted hover:bg-accent-soft hover:text-ink"}`}>
            Visi moduļi
          </Link>
          {modules.map((m) => (
            <Link
              key={m.id}
              href={href(status, m.id)}
              title={m.title}
              aria-current={m.id === moduleId ? "page" : undefined}
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm tabular-nums ${m.id === moduleId ? "bg-accent-soft font-semibold" : "text-muted hover:bg-accent-soft hover:text-ink"}`}
            >
              {m.order}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">{rows.length} jautājumi</p>
      <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/skaidrojumi/${r.id}${qs}`} className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-surface">
              <span className="w-14 shrink-0 tabular-nums text-muted">Nr. {r.id}</span>
              <span className="hidden w-10 shrink-0 tabular-nums text-muted sm:block">{r.topicId}</span>
              <span className="min-w-0 flex-1 truncate">{r.text}</span>
              {r.possiblyOutdated && <span className="hidden shrink-0 rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn sm:inline-flex">Likuma izmaiņas</span>}
              <ExplanationBadge status={r.status} has={r.hasExplanation} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
