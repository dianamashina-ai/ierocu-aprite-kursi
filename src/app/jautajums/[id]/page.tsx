import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPracticeQuestion, getTopicMeta, topicSlug } from "@/lib/content/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Practice } from "@/components/practice/practice";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule, moduleOfTopic } from "@/lib/billing/access";
import { Paywall } from "@/components/billing/paywall";

export const dynamic = "force-dynamic";

const parseId = (s: string) => (/^\d{1,3}$/.test(s) ? Number(s) : null);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  return { title: id ? `Jautājums Nr. ${id}` : undefined };
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const q = id ? await getPracticeQuestion(id) : null;
  if (!q) notFound();
  const [meta, tc, tp] = await Promise.all([getTopicMeta(q.topicId), getTranslations("common"), getTranslations("practice")]);
  const topicHref = `/tema/${topicSlug(q.topicId)}`;
  const user = await getCurrentUser();
  const allowed = await canAccessModule(user?.id, moduleOfTopic(q.topicId));

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <Breadcrumbs
        items={[
          ...(meta ? [{ href: `/modulis/${meta.moduleId}`, label: tc("module", { order: meta.moduleOrder }) }] : []),
          { href: topicHref, label: meta ? `${meta.id} ${meta.titleLv}` : tc("topic", { id: q.topicId }) },
          { label: tc("question", { id: q.id }) },
        ]}
      />
      <p className="mt-4 text-sm text-muted">
        {tc("question", { id: q.id })} · {tc("pdfPage", { page: q.sourcePage })}
      </p>
      <div className="mt-3">
        {allowed ? (
          <Practice signedIn={Boolean(user)} questions={[q]} seed={randomUUID()} topicHref={topicHref} shuffleQuestions={false} />
        ) : (
          <div className="space-y-5">
            <p className="rounded-2xl border border-line bg-white p-5 text-lg font-semibold leading-snug" lang="lv">{q.text}</p>
            <Paywall title="Atbilde un skaidrojums pieejami ar pilnu piekļuvi" />
          </div>
        )}
      </div>
      <p className="mt-6 text-sm text-muted">{tp("officialText")}</p>
      {q.id > 1 || q.id < 515 ? (
        <nav className="mt-6 flex justify-between text-sm" aria-label="Jautājumi">
          {q.id > 1 ? <Link className="btn-ghost" href={`/jautajums/${q.id - 1}`}>← Nr. {q.id - 1}</Link> : <span />}
          {q.id < 515 && <Link className="btn-ghost" href={`/jautajums/${q.id + 1}`}>Nr. {q.id + 1} →</Link>}
        </nav>
      ) : null}
    </div>
  );
}
