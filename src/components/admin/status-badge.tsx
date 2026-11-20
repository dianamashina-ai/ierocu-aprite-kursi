const ORDER: Record<string, { label: string; cls: string }> = {
  paid: { label: "Apmaksāts", cls: "bg-ok-soft text-ok" },
  pending: { label: "Gaida apmaksu", cls: "bg-warn-soft text-warn" },
  refunded: { label: "Atmaksāts", cls: "bg-err-soft text-err" },
  failed: { label: "Neizdevās", cls: "bg-surface text-muted" },
  canceled: { label: "Atcelts", cls: "bg-surface text-muted" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const s = ORDER[status] ?? { label: status, cls: "bg-surface text-muted" };
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

export function ExplanationBadge({ status, has }: { status: string; has: boolean }) {
  if (!has) return <span className="inline-flex shrink-0 rounded-full bg-err-soft px-2.5 py-0.5 text-xs font-semibold text-err">Nav skaidrojuma</span>;
  return status === "reviewed" ? (
    <span className="inline-flex shrink-0 rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">Pārbaudīts</span>
  ) : (
    <span className="inline-flex shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">Melnraksts</span>
  );
}
