import { getLocale, getTranslations } from "next-intl/server";
import { getCourseOverview } from "@/lib/content/queries";
import { FREE_MODULE_IDS } from "@/config/exam";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [t, locale, course] = await Promise.all([getTranslations("home"), getLocale(), getCourseOverview()]);
  const title = (x: { titleLv: string; titleRu: string }) => (locale === "ru" ? x.titleRu : x.titleLv);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">{t("heading")}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t("lead", course.totals)}</p>

      <h2 className="mt-12 text-xl font-semibold">{t("modulesHeading")}</h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2">
        {course.modules.map((m) => (
          <li key={m.id} className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">
                <span className="text-accent">{m.order}.</span> {title(m)}
              </h3>
              {(FREE_MODULE_IDS as readonly string[]).includes(m.id) && (
                <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
                  {t("free")}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {t("topicsCount", { count: m.topics.length })} · {t("questionsCount", { count: m.questionCount })}
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {m.topics.map((tp) => (
                <li key={tp.id} className="flex justify-between gap-3">
                  <span>
                    <span className="text-muted">{tp.id}</span> {title(tp)}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">{tp.questionCount}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
