import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPracticeQuestionsForTopic, getTopicMeta, topicIdFromSlug, topicSlug } from "@/lib/content/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Practice } from "@/components/practice/practice";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const meta = await getTopicMeta(topicIdFromSlug((await params).slug));
  return { title: meta ? `Treniņš: ${meta.titleLv}` : undefined };
}

export default async function PracticePage({ params }: { params: Promise<{ slug: string }> }) {
  const topicId = topicIdFromSlug((await params).slug);
  const [meta, questions, tc] = await Promise.all([
    getTopicMeta(topicId),
    getPracticeQuestionsForTopic(topicId),
    getTranslations("common"),
  ]);
  if (!meta || !questions.length) notFound();
  const topicHref = `/tema/${topicSlug(topicId)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <Breadcrumbs
        items={[
          { href: `/modulis/${meta.moduleId}`, label: tc("module", { order: meta.moduleOrder }) },
          { href: topicHref, label: `${meta.id} ${meta.titleLv}` },
          { label: "Treniņš" },
        ]}
      />
      <div className="mt-5">
        {/* sēkla katram apmeklējumam jauna → cita jautājumu un variantu secība */}
        <Practice questions={questions} seed={randomUUID()} topicHref={topicHref} />
      </div>
    </div>
  );
}
