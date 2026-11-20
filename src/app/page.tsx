import Link from "next/link";
import { ArrowUpRight, Lock, Search } from "lucide-react";
import { getCourseOverview } from "@/lib/content/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { hasFullAccess, isFreeModule } from "@/lib/billing/access";
import { getTopicProgress } from "@/lib/progress/service";
import { MODULE_META } from "@/config/module-meta";
import { ModuleIcon } from "@/components/module-icon";
import { Hero } from "@/components/home/hero";
import { CourseOutline } from "@/components/home/course-outline";
import { WhoCanOwn } from "@/components/home/who-can-own";
import { Faq } from "@/components/home/faq";
import { readLesson } from "@/lib/content/lessons";
import { getPracticeQuestion } from "@/lib/content/queries";
import { getDashboard, getExamConfig } from "@/lib/progress/service";
import { ProgressSummary } from "@/components/home/progress-summary";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");

/** Vārds sveicienam: tikai ja lietotājs to norādījis (pēc noklusējuma vārds = e-pasta sākums). */
function greetingName(u: { name: string; email: string } | null) {
  if (!u) return null;
  const name = u.name.trim();
  if (!name || name.toLowerCase() === u.email.split("@")[0].toLowerCase()) return null;
  return name.split(/\s+/)[0];
}

export default async function HomePage() {
  const [course, user] = await Promise.all([
    getCourseOverview(),
    getCurrentUser(),
  ]);
  const [access, progress, sample, examCfg, dashboard] = await Promise.all([
    hasFullAccess(user?.id),
    user ? getTopicProgress(user.id) : Promise.resolve(null),
    user ? Promise.resolve(null) : getPracticeQuestion(435), // paraugs sākumlapai: lielas enerģijas pneimatiskais ierocis
    getExamConfig(),
    user ? getDashboard(user.id) : Promise.resolve(null),
  ]);

  return (
    <>
      {!user && (
        <>
          <Hero
            sample={sample}
            stats={{
              ...course.totals,
              examMinutes: examCfg.durationMinutes,
              examQuestions: examCfg.questionCount,
            }}
          />
          <WhoCanOwn />
          <CourseOutline
            totals={course.totals}
            modules={course.modules.map((m) => ({
              ...m,
              topics: m.topics.map((t) => ({ id: t.id, titleLv: t.titleLv, questionCount: t.questionCount, minutes: readLesson(t.id)?.minutes ?? null })),
            }))}
          />
          <Faq
            totalQuestions={course.totals.questions}
            exam={{
              questions: examCfg.questionCount,
              minutes: examCfg.durationMinutes,
              maxWrong: examCfg.questionCount - Math.ceil((examCfg.questionCount * examCfg.passPercent) / 100),
            }}
          />
        </>
      )}
      {user && (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
                {greetingName(user) ? `Sveiki, ${greetingName(user)}!` : "Sveiki!"}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                {dashboard && dashboard.answeredQuestions > 0
                  ? "Turpini tur, kur palikāt — vai pārbaudi sevi izmēģinājuma eksāmenā."
                  : `Sāc ar pirmo nodarbību — ${course.totals.topics} īsās nodarbībās un ${course.totals.questions} oficiālajos jautājumos ir viss eksāmenam vajadzīgais.`}
              </p>
            </div>
            {dashboard && <ProgressSummary d={dashboard} totalTopics={course.totals.topics} />}
          </>

        <div
          id="moduli"
          className={`mt-14 flex scroll-mt-6 flex-col gap-4 border-y border-line py-5 sm:flex-row sm:items-center sm:justify-between`}
        >
          <h2 className="text-3xl font-semibold tracking-tight">
            Moduļi
          </h2>
          <form
            action="/meklet"
            role="search"
            className="relative w-full sm:w-80"
          >
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <label htmlFor="home-search" className="sr-only">
              Meklēt jautājumu
            </label>
            <input
              id="home-search"
              type="search"
              name="q"
              placeholder="Meklēt jautājumu vai numuru…"
              className="block min-h-12 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-base placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </form>
        </div>

        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {course.modules.map((m) => {
            const free = isFreeModule(m.id);
            const locked = !free && !access;
            const mastered = progress
              ? m.topics.reduce(
                  (s, tp) => s + (progress.get(tp.id)?.mastered ?? 0),
                  0,
                )
              : 0;
            const percent = m.questionCount
              ? Math.round((mastered / m.questionCount) * 100)
              : 0;
            return (
              <li
                key={m.id}
                className="group relative flex flex-col rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(39,23,38,0.25)]"
              >
                <div className="flex items-start justify-between">
                  <ModuleIcon moduleId={m.id} />
                  <span className="text-2xl font-bold tabular-nums text-accent-strong">
                    {pad(m.order)}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold leading-snug tracking-tight">
                  <Link
                    href={`/modulis/${m.id}`}
                    className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
                  >
                    {m.titleLv}
                  </Link>
                </h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">
                  {MODULE_META[m.id]?.description}
                </p>
                <div className="mt-6 flex items-center justify-between gap-3 text-sm">
                  <span>
                    {m.topics.length} tēmas · Jautājumi: {m.questionCount}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
                <div
                  className="mt-4 h-1 overflow-hidden rounded-full bg-line"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                  {locked ? (
                    <>
                      <Lock aria-hidden="true" className="size-3.5" /> Pilnajā
                      piekļuvē
                    </>
                  ) : !user ? (
                    free ? (
                      <span className="font-semibold text-ok">Bez maksas</span>
                    ) : (
                      "Pieejams"
                    )
                  ) : percent === 0 ? (
                    "Vēl nav sākts"
                  ) : (
                    `Apgūti ${percent} %`
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
      )}
    </>
  );
}
