import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { asc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/page-header";
import { getCourseOverview, getQuestionCards, searchQuestions, searchStems, topicSlug } from "@/lib/content/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFullAccess, isFreeModule, moduleOfTopic } from "@/lib/billing/access";
import { getWrongIds } from "@/lib/progress/service";
import { QuestionCard } from "@/components/questions/question-card";
import { AnswersToggle } from "@/components/questions/answers-toggle";
import { AutoSubmit } from "@/components/questions/auto-submit";
import { FullCourseUpsell } from "@/components/billing/full-course-upsell";
import { Paywall } from "@/components/billing/paywall";
import { lockedTotals } from "@/lib/billing/upsell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jautājumi" };

const SEARCH_LIMIT = 50;

/** Visi oficiālie jautājumi pēc numuriem: meklēšana, modulis, “tikai manas kļūdas”, pareizās atbildes. */
export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; modulis?: string; kludas?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").slice(0, 200).trim();
  const user = await getCurrentUser();
  const [course, full, t] = await Promise.all([getCourseOverview(), hasFullAccess(user?.id), getTranslations("search")]);
  const moduleIds = course.modules.map((m) => m.id);
  // modulis: URL → tas; ar meklēšanu bez moduļa → visi; citādi → 1. modulis
  const modulis = sp.modulis === "visi" ? "" : sp.modulis && moduleIds.includes(sp.modulis) ? sp.modulis : query ? "" : moduleIds[0];
  const onlyWrong = Boolean(user) && sp.kludas === "1";

  // jautājumu id saraksts
  let ids: number[];
  let limited = false;
  if (query) {
    const found = await searchQuestions(query, SEARCH_LIMIT);
    ids = found.filter((r) => !modulis || moduleOfTopic(r.topicId) === modulis).map((r) => r.id);
    limited = found.length === SEARCH_LIMIT;
  } else {
    const topicIds = course.modules.filter((m) => !modulis || m.id === modulis).flatMap((m) => m.topics.map((tp) => tp.id));
    const rows = await db
      .select({ id: schema.questions.id })
      .from(schema.questions)
      .where(inArray(schema.questions.topicId, topicIds))
      .orderBy(asc(schema.questions.id));
    ids = rows.map((r) => r.id);
  }
  if (onlyWrong && user) {
    const wrong = new Set(await getWrongIds(user.id));
    ids = ids.filter((id) => wrong.has(id));
  }
  const cards = await getQuestionCards(ids);
  const topicTitle = new Map(course.modules.flatMap((m) => m.topics.map((tp) => [tp.id, tp.titleLv] as const)));
  const stems = query ? searchStems(query) : [];
  const allowedFor = (topicId: string) => full || (Boolean(user) && isFreeModule(moduleOfTopic(topicId)));
  const hasLocked = cards.some((c) => !allowedFor(c.topicId));

  return (
    <div className="page-white mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="Jautājumi"
        lead={`Visi ${course.totals.questions} oficiālie eksāmena jautājumi pēc numuriem — ar pareizajām atbildēm un skaidrojumiem.`}
      />

      {/* meklēšana — vienmēr visos moduļos */}
      <form action="/jautajumi" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">{t("label")}</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t("placeholder")}
            className="block min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base placeholder:text-muted"
          />
        </label>
        {onlyWrong && <input type="hidden" name="kludas" value="1" />}
        <button type="submit" className="btn-primary">
          {t("submit")}
        </button>
      </form>

      {/* filtri */}
      <form action="/jautajumi" method="get" className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        {query && <input type="hidden" name="q" value={query} />}
        <label className="sm:w-80">
          <span className="sr-only">Modulis</span>
          <select
            name="modulis"
            defaultValue={modulis || "visi"}
            className="block min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-[15px]"
          >
            <option value="visi">Visi moduļi</option>
            {course.modules.map((m) => (
              <option key={m.id} value={m.id}>
                {String(m.order).padStart(2, "0")} {m.titleLv}
              </option>
            ))}
          </select>
        </label>
        {user && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" name="kludas" value="1" defaultChecked={onlyWrong} className="size-4 accent-accent" />
            Tikai manas kļūdas
          </label>
        )}
        <noscript>
          <button type="submit" className="btn-secondary min-h-11">Rādīt</button>
        </noscript>
        <AutoSubmit />
      </form>

      <section className="mt-8" aria-live="polite">
        <p className="font-semibold">{t("results", { count: cards.length })}</p>
        {cards.length === 0 && (
          <p className="mt-1 text-muted">{onlyWrong ? "Šajā izlasē kļūdu nav." : t("noResults")}</p>
        )}
        {limited && <p className="mt-1 text-sm text-muted">{t("limited", { count: SEARCH_LIMIT })}</p>}

        {cards.length > 0 && (
          <div className="mt-4">
            <AnswersToggle>
              <ol className="mt-4 divide-y divide-line">
                {cards.map((q) => (
                  <li key={q.id} className="py-5">
                    <QuestionCard
                      q={q}
                      allowed={allowedFor(q.topicId)}
                      stems={stems}
                      meta={
                        <Link
                          href={`/tema/${topicSlug(q.topicId)}`}
                          className="mt-1 inline-block text-sm text-muted hover:text-accent-strong hover:underline"
                        >
                          Tēma {q.topicId} · {topicTitle.get(q.topicId)}
                        </Link>
                      }
                    />
                  </li>
                ))}
              </ol>
            </AnswersToggle>
          </div>
        )}

        {hasLocked && (
          <div className="mt-8">
            {user ? (
              <FullCourseUpsell title="Atbildes un skaidrojumi visiem jautājumiem" {...(await lockedTotals())} />
            ) : (
              <Paywall title="Atbildes un skaidrojumi pieejami pēc reģistrācijas">1. modulis — bez maksas, pārējie — pilnajā kursā.</Paywall>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
