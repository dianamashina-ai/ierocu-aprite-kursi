import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { searchQuestions } from "@/lib/content/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meklēt jautājumus" };

const LIMIT = 50;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = ((await searchParams).q ?? "").slice(0, 200);
  const t = await getTranslations("search");
  const results = query.trim() ? await searchQuestions(query, LIMIT) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">{t("heading")}</h1>
      <form action="/meklet" method="get" role="search" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="text-sm text-muted">{t("label")}</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t("placeholder")}
            autoFocus={!query}
            className="mt-1 block min-h-12 w-full rounded-xl border-2 border-line bg-white px-4 text-base focus:border-accent focus:outline-none"
          />
        </label>
        <button type="submit" className="btn-primary">{t("submit")}</button>
      </form>

      {results && (
        <section className="mt-8" aria-live="polite">
          <p className="font-medium">{t("results", { count: results.length })}</p>
          {results.length === 0 && <p className="mt-1 text-muted">{t("noResults")}</p>}
          {results.length === LIMIT && <p className="mt-1 text-sm text-muted">{t("limited", { count: LIMIT })}</p>}
          <ol className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
            {results.map((r) => (
              <li key={r.id}>
                <Link href={`/jautajums/${r.id}`} className="flex gap-3 px-4 py-3 hover:bg-accent-soft">
                  <span className="w-10 shrink-0 tabular-nums text-muted">{r.id}</span>
                  <span className="flex-1" lang="lv">{r.text}</span>
                  <span className="shrink-0 text-xs text-muted">{r.topicId}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
