/** Vienots lapas ietvars un virsraksts (Trenēties, Eksāmens, Meklēt u. c.). */
export const PAGE_CLASS = "page-white mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12";
/** Galvenā darbības kartīte zem virsraksta */
export const ACTION_CARD_CLASS = "max-w-2xl rounded-2xl border border-line bg-white p-5 sm:p-6";

export function PageHeader({ title, lead }: { title: string; lead?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      {lead && <p className="mt-3 max-w-2xl text-lg text-muted">{lead}</p>}
    </header>
  );
}
