import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getModule, topicSlug } from "@/lib/content/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const data = await getModule((await params).id);
  return { title: data ? data.module.titleLv : undefined };
}

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const data = await getModule((await params).id);
  if (!data) notFound();
  const { module: m, prev, next } = data;
  const [t, tc] = await Promise.all([getTranslations("module"), getTranslations("common")]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Sākums" }, { label: tc("module", { order: m.order }) }]} />
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-balance">{m.titleLv}</h1>
      <p className="mt-2 text-muted">
        {tc("topicsCount", { count: m.topics.length })} · {tc("questionsCount", { count: m.questionCount })}
      </p>

      <h2 className="mt-10 text-xl font-semibold">{t("topicsHeading")}</h2>
      <ol className="mt-4 space-y-3">
        {m.topics.map((tp) => (
          <li key={tp.id}>
            <Link
              href={`/tema/${topicSlug(tp.id)}`}
              className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-line bg-white px-5 py-4 hover:border-accent"
            >
              <span>
                <span className="block text-sm text-muted">{tc("topic", { id: tp.id })}</span>
                <span className="font-medium">{tp.titleLv}</span>
              </span>
              <span className="shrink-0 text-sm tabular-nums text-muted">{tc("questionsCount", { count: tp.questionCount })}</span>
            </Link>
          </li>
        ))}
      </ol>

      <nav className="mt-10 flex flex-wrap justify-between gap-3 text-sm" aria-label="Moduļi">
        {prev ? <Link className="btn-ghost" href={`/modulis/${prev.id}`}>← {tc("prevModule")}</Link> : <span />}
        {next && <Link className="btn-ghost" href={`/modulis/${next.id}`}>{tc("nextModule")} →</Link>}
      </nav>
    </div>
  );
}
