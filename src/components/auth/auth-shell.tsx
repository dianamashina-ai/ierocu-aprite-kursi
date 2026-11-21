export function AuthShell({ title, lead, error, children }: { title: string; lead?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {lead && <p className="mt-2 text-muted">{lead}</p>}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-err-soft px-3 py-2 text-sm text-err">
          {error}
        </p>
      )}
      <div className="mt-8 rounded-2xl border border-line bg-white p-6">{children}</div>
    </div>
  );
}
