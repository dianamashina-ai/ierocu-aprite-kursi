/** Kopīgs izkārtojums juridiskajām lapām (noteikumi, privātums, sīkdatnes, kontakti). */
export const LEGAL_UPDATED = "2026. gada 20. novembrī";

export function LegalPage({ title, children, updated = true }: { title: string; children: React.ReactNode; updated?: boolean }) {
  return (
    <div className="page-white">
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        {updated && <p className="mt-3 text-sm text-muted">Pēdējās izmaiņas: {LEGAL_UPDATED}</p>}
        <div className="legal mt-8 space-y-4 leading-relaxed">{children}</div>
      </article>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-6 text-xl font-semibold">{children}</h2>;
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-muted">{children}</ul>;
}
