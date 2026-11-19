import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCourseOverview, topicSlug } from "@/lib/content/queries";
import { FREE_MODULE_IDS } from "@/config/exam";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [t, tc, course] = await Promise.all([getTranslations("home"), getTranslations("common"), getCourseOverview()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-balance sm:text-4xl">{t("heading")}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t("lead", course.totals)}</p>
      <div className="mt-6">
        <Link href="/modulis/M1" className="btn-primary">
          {t("start")}
        </Link>
      </div>

      <h2 id="moduli" className="mt-14 scroll-mt-6 text-xl font-semibold">
        {t("modulesHeading")}
      </h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2">
        {course.modules.map((m) => (
          <li key={m.id} className="flex flex-col rounded-xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">
                <Link href={`/modulis/${m.id}`} className="underline-offset-4 hover:text-accent-strong hover:underline">
                  <span className="text-accent">{m.order}.</span> {m.titleLv}
                </Link>
              </h3>
              {(FREE_MODULE_IDS as readonly string[]).includes(m.id) && (
                <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
                  {tc("free")}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {tc("topicsCount", { count: m.topics.length })} · {tc("questionsCount", { count: m.questionCount })}
            </p>
            <ul className="mt-3 space-y-0.5 text-sm">
              {m.topics.map((tp) => (
                <li key={tp.id}>
                  <Link
                    href={`/tema/${topicSlug(tp.id)}`}
                    className="flex min-h-9 items-center justify-between gap-3 rounded-md px-1 hover:bg-accent-soft"
                  >
                    <span>
                      <span className="text-muted">{tp.id}</span> {tp.titleLv}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">{tp.questionCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
