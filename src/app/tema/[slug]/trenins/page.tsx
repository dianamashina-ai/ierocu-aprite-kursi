import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPracticeQuestionsForTopic, getTopicMeta, topicIdFromSlug, topicSlug } from "@/lib/content/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Practice } from "@/components/practice/practice";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule, hasFullAccess, isFreeModule, requireSignUpForFreeModule } from "@/lib/billing/access";
import { FullCourseUpsell } from "@/components/billing/full-course-upsell";
import { lockedTotals } from "@/lib/billing/upsell";
import { Paywall } from "@/components/billing/paywall";

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
  const user = await getCurrentUser();
  requireSignUpForFreeModule(user?.id, meta.moduleId, `/tema/${topicSlug(meta.id)}/trenins`);
  const allowed = await canAccessModule(user?.id, meta.moduleId);
  const upsell =
    allowed && isFreeModule(meta.moduleId) && !(await hasFullAccess(user?.id)) ? <FullCourseUpsell {...(await lockedTotals())} /> : null;

  return (
    <div className="page-white mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { href: `/modulis/${meta.moduleId}`, label: tc("module", { order: meta.moduleOrder }) },
          { href: topicHref, label: `${meta.id} ${meta.titleLv}` },
          { label: "Treniņš" },
        ]}
      />
      <div className="mt-5 max-lg:[body:has(.focus-mode)_&]:mt-0">
        {/* sēkla katram apmeklējumam jauna → cita jautājumu un variantu secība */}
        {allowed ? (
          <Practice upsell={upsell} signedIn={Boolean(user)} questions={questions} seed={randomUUID()} topicHref={topicHref} />
        ) : (
          <Paywall />
        )}
      </div>
    </div>
  );
}
