import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
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
import { HowItWorks } from "@/components/home/how-it-works";
import { ContentDivider } from "@/components/home/divider";
import { Pricing } from "@/components/home/pricing";
import { courseIncluded } from "@/lib/billing/included";
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
            stats={{
              ...course.totals,
              examMinutes: examCfg.durationMinutes,
              examQuestions: examCfg.questionCount,
            }}
          />
          <ContentDivider />
          <HowItWorks
            modules={course.totals.modules}
            questions={course.totals.questions}
            examQuestions={examCfg.questionCount}
            examMinutes={examCfg.durationMinutes}
            sample={sample}
          />
          <ContentDivider />
          <CourseOutline
            totals={course.totals}
            modules={course.modules.map((m) => ({
              ...m,
              topics: m.topics.map((t) => ({ id: t.id, titleLv: t.titleLv, questionCount: t.questionCount, minutes: readLesson(t.id)?.minutes ?? null })),
            }))}
          />
          <ContentDivider />
          <WhoCanOwn />
          <Pricing included={courseIncluded(course.totals, { questions: examCfg.questionCount, minutes: examCfg.durationMinutes })} />
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
            {dashboard && <ProgressSummary d={dashboard} />}
          </>

        <div
          id="moduli"
          className="mt-14 scroll-mt-24"
        >
          <h2 className="text-3xl font-semibold tracking-tight">
            Moduļi
          </h2>
        </div>

        <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  <span className="text-2xl font-bold tabular-nums text-accent-strong">
                    {pad(m.order)}
                  </span>
                  <ModuleIcon moduleId={m.id} />
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
                    {m.topics.length} tēmas • {m.questionCount} jautājumi
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

        <section aria-labelledby="exam-cta-h" className="mt-10 flex flex-col gap-5 rounded-2xl bg-accent p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 id="exam-cta-h" className="text-2xl font-semibold tracking-tight">Izmēģinājuma eksāmens</h2>
            <p className="mt-2 max-w-xl text-white/80">
              {examCfg.questionCount} jautājumi, {examCfg.durationMinutes} minūtes — tāpat kā īstajā eksāmenā. Pārbaudi, vai esi gatavs.
            </p>
          </div>
          <Link href="/eksamens" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-accent-strong transition-colors hover:bg-accent-soft">
            Sākt eksāmenu <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </div>
      )}
    </>
  );
}
