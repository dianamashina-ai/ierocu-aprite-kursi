import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCourseOverview, getQuestionCards, searchQuestions, searchStems, topicSlug } from "@/lib/content/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFullAccess, isFreeModule, moduleOfTopic } from "@/lib/billing/access";
import { QuestionCard } from "@/components/questions/question-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meklēt jautājumus" };

const LIMIT = 50;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = ((await searchParams).q ?? "").slice(0, 200);
  const t = await getTranslations("search");
  const found = query.trim() ? await searchQuestions(query, LIMIT) : null;
  const [results, course, full] = await Promise.all([
    found ? getQuestionCards(found.map((r) => r.id)) : null,
    found?.length ? getCourseOverview() : null,
    getCurrentUser().then((u) => hasFullAccess(u?.id)),
  ]);
  const topicTitle = new Map(course?.modules.flatMap((m) => m.topics.map((t) => [t.id, t.titleLv] as const)) ?? []);
  const stems = searchStems(query);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">{t("heading")}</h1>
      <form action="/meklet" method="get" role="search" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="sr-only">{t("label")}</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t("placeholder")}
            autoFocus={!query}
            className="block min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base placeholder:text-muted"
          />
        </label>
        <button type="submit" className="btn-primary">{t("submit")}</button>
      </form>

      {results && (
        <section className="mt-8" aria-live="polite">
          <p className="font-semibold">{t("results", { count: results.length })}</p>
          {results.length === 0 && <p className="mt-1 text-muted">{t("noResults")}</p>}
          {results.length === LIMIT && <p className="mt-1 text-sm text-muted">{t("limited", { count: LIMIT })}</p>}
          <ol className="mt-2 divide-y divide-line">
            {results.map((q) => (
              <li key={q.id} className="py-5">
                <QuestionCard
                  q={q}
                  allowed={full || isFreeModule(moduleOfTopic(q.topicId))}
                  stems={stems}
                  meta={
                    <Link href={`/tema/${topicSlug(q.topicId)}`} className="mt-1 inline-block text-sm text-muted hover:text-accent-strong hover:underline">
                      Tēma {q.topicId} · {topicTitle.get(q.topicId)}
                    </Link>
                  }
                />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
