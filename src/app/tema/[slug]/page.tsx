import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTopic, topicIdFromSlug, topicSlug } from "@/lib/content/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getTopic(topicIdFromSlug((await params).slug));
  return { title: data ? `${data.topic.id} ${data.topic.titleLv}` : undefined };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getTopic(topicIdFromSlug((await params).slug));
  if (!data) notFound();
  const { topic, questions, prev, next } = data;
  const [t, tc] = await Promise.all([getTranslations("topic"), getTranslations("common")]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { href: "/", label: "Sākums" },
          { href: `/modulis/${topic.module.id}`, label: tc("module", { order: topic.module.order }) },
          { label: tc("topic", { id: topic.id }) },
        ]}
      />
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-balance">{topic.titleLv}</h1>
      <p className="mt-2 text-muted">{topic.module.titleLv}</p>

      <div className="mt-6">
        <Link href={`/tema/${topicSlug(topic.id)}/trenins`} className="btn-primary">
          {t("practice", { count: questions.length })}
        </Link>
      </div>

      <section className="mt-10 rounded-xl border border-line bg-white p-5" aria-labelledby="lesson-h">
        <h2 id="lesson-h" className="text-lg font-semibold">{t("lessonHeading")}</h2>
        <p className="mt-2 text-muted">{t("lessonSoon")}</p>
      </section>

      <section className="mt-10" aria-labelledby="qs-h">
        <h2 id="qs-h" className="text-lg font-semibold">{t("questionsHeading")}</h2>
        <ol className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/jautajums/${q.id}`} className="flex gap-3 px-4 py-3 hover:bg-accent-soft">
                <span className="w-10 shrink-0 tabular-nums text-muted">{q.id}</span>
                <span className="flex-1" lang="lv">{q.text}</span>
                {q.familyId && (
                  <span className="h-fit shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-strong">
                    {t("similarBadge")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <nav className="mt-10 flex flex-wrap justify-between gap-3 text-sm" aria-label="Tēmas">
        {prev ? <Link className="btn-ghost" href={`/tema/${topicSlug(prev.id)}`}>← {tc("prevTopic")}</Link> : <span />}
        {next && <Link className="btn-ghost" href={`/tema/${topicSlug(next.id)}`}>{tc("nextTopic")} →</Link>}
      </nav>
    </div>
  );
}
