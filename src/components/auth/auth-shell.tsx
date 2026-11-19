export function AuthShell({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {lead && <p className="mt-2 text-muted">{lead}</p>}
      <div className="mt-8 rounded-2xl border border-line bg-white p-6">{children}</div>
    </div>
  );
}
