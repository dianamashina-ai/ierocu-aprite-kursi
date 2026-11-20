import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Lock, Target } from "lucide-react";
import { getModule, topicSlug } from "@/lib/content/queries";
import { readLesson } from "@/lib/content/lessons";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule, isFreeModule } from "@/lib/billing/access";
import { getTopicProgress } from "@/lib/progress/service";
import { Paywall } from "@/components/billing/paywall";
import { ModuleIcon } from "@/components/module-icon";
import { MODULE_META } from "@/config/module-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const data = await getModule((await params).id);
  return { title: data ? data.module.titleLv : undefined };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const data = await getModule((await params).id);
  if (!data) notFound();
  const { module: m, prev, next } = data;
  const user = await getCurrentUser();
  const [allowed, progress] = await Promise.all([canAccessModule(user?.id, m.id), user ? getTopicProgress(user.id) : Promise.resolve(null)]);
  const lessons = new Map(m.topics.map((tp) => [tp.id, readLesson(tp.id)]));
  const minutes = [...lessons.values()].reduce((s, l) => s + (l?.minutes ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Mācību kurss" }, { label: m.titleLv }]} />

      <header className="mt-6 flex items-start gap-5 sm:gap-8">
        <span className="hidden text-7xl font-bold leading-none tabular-nums text-accent-strong sm:block lg:text-8xl">{pad(m.order)}</span>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {pad(m.order)} · Modulis
            {isFreeModule(m.id) && <span className="ml-2 rounded-full bg-ok-soft px-2 py-0.5 normal-case tracking-normal text-ok">Bez maksas</span>}
          </p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">{m.titleLv}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{MODULE_META[m.id]?.description}</p>
        </div>
        <div className="hidden md:block">
          <ModuleIcon moduleId={m.id} size="lg" />
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="topics-h">
          <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
            <h2 id="topics-h" className="text-2xl font-semibold tracking-tight">Tēmas</h2>
            <p className="text-sm text-muted">
              {m.topics.length} tēmas · ~{minutes} min lasīšanai
            </p>
          </div>
          <ol className="divide-y divide-line border-b border-line">
            {m.topics.map((tp, i) => {
              const l = lessons.get(tp.id);
              const mastered = progress?.get(tp.id)?.mastered ?? 0;
              const pct = tp.questionCount ? Math.round((mastered / tp.questionCount) * 100) : 0;
              return (
                <li key={tp.id}>
                  <Link href={`/tema/${topicSlug(tp.id)}`} className="group flex items-center gap-4 py-5 hover:bg-white/60 sm:gap-5 sm:px-2">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-sm font-bold tabular-nums">
                      {pad(i + 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-semibold leading-snug group-hover:text-accent-strong">{tp.titleLv}</span>
                      <span className="mt-1 block text-sm text-muted">
                        {l ? `${l.minutes} min lasīšanai · ` : ""}
                        {tp.questionCount} jautājumi
                        {user && allowed && pct > 0 ? ` · apgūti ${pct} %` : ""}
                      </span>
                    </span>
                    {allowed ? (
                      <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    ) : (
                      <Lock aria-label="slēgts" className="size-4 shrink-0 text-muted" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="lg:pt-2">
          {allowed ? (
            <div className="rounded-2xl bg-accent-soft p-6 lg:sticky lg:top-6">
              <Target aria-hidden="true" className="size-7 text-accent-strong" strokeWidth={1.75} />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Nostiprini apgūto</p>
              <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
                Zini atbildi.
                <br />
                Saproti, kāpēc.
              </p>
              <p className="mt-3 text-sm text-muted">
                Šajā modulī ir {m.questionCount} jautājumi. Pēc katras atbildes redzēsi skaidrojumu ar atsauci uz likumu.
              </p>
              <Link href={`/modulis/${m.id}/trenins`} className="btn-primary mt-6 w-full gap-2">
                Trenēties visā modulī <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          ) : (
            <Paywall>Nodarbību sākumu un jautājumu tekstus vari apskatīt, bet treniņš, skaidrojumi un eksāmens — ar pilnu piekļuvi.</Paywall>
          )}
        </aside>
      </div>

      <nav className="mt-12 flex flex-wrap justify-between gap-3 text-sm" aria-label="Moduļi">
        {prev ? <Link className="btn-ghost" href={`/modulis/${prev.id}`}>← {prev.titleLv}</Link> : <span />}
        {next && <Link className="btn-ghost" href={`/modulis/${next.id}`}>{next.titleLv} →</Link>}
      </nav>
    </div>
  );
}
