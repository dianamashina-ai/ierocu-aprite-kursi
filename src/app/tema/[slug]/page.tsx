import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTopic, topicIdFromSlug, topicSlug } from "@/lib/content/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LessonBody } from "@/components/lesson-body";
import { lessonHeadings } from "@/lib/content/lesson-markdown";
import { ArrowUpRight, Clock, Target, Check } from "lucide-react";
import { readLesson } from "@/lib/content/lessons";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/billing/access";
import { Paywall } from "@/components/billing/paywall";

export const dynamic = "force-dynamic";

/** Nodarbības sākums viesim: pirmā rindkopa (bez virsraksta beigās). */
function lessonTeaser(body: string) {
  const chunks = body.split(/\n\s*\n/);
  const out: string[] = [];
  for (const c of chunks) {
    if (c.startsWith("## ")) break;
    out.push(c);
  }
  return (out.length ? out : chunks.slice(0, 1)).join("\n\n");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const data = await getTopic(topicIdFromSlug((await params).slug));
  return { title: data ? `${data.topic.id} ${data.topic.titleLv}` : undefined };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cilne?: string }>;
}) {
  const data = await getTopic(topicIdFromSlug((await params).slug));
  const tab =
    (await searchParams).cilne === "jautajumi" ? "questions" : "lesson";
  if (!data) notFound();
  const { topic, questions, prev, next } = data;
  const [t, tc] = await Promise.all([
    getTranslations("topic"),
    getTranslations("common"),
  ]);
  const lesson = readLesson(topic.id);
  const allowed = await canAccessModule(
    (await getCurrentUser())?.id,
    topic.module.id,
  );
  // bez piekļuves — nodarbības sākums (pirmās divas rindkopas) un aicinājums iegādāties
  const lessonBody =
    lesson && !allowed ? lessonTeaser(lesson.body) : lesson?.body;

  const pad = (n: number) => String(n).padStart(2, "0");
  const headings = lesson && allowed ? lessonHeadings(lesson.body) : [];
  const siblings = topic.module.topics;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Breadcrumbs
        items={[
          { href: "/", label: "Mācību kurss" },
          { href: `/modulis/${topic.module.id}`, label: topic.module.titleLv },
          { label: tc("topic", { id: topic.id }) },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <nav
            aria-label="Moduļa tēmas"
            className="sticky top-6 border-r border-line pr-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {pad(topic.module.order)} / {topic.module.titleLv}
            </p>
            <ol className="mt-5 space-y-1">
              {siblings.map((s, i) => {
                const current = s.id === topic.id;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/tema/${topicSlug(s.id)}`}
                      aria-current={current ? "page" : undefined}
                      className={`flex gap-3 rounded-lg py-2 text-[15px] leading-snug ${current ? "font-semibold text-accent-strong" : "text-muted hover:text-ink"}`}
                    >
                      <span className="w-4 shrink-0 tabular-nums">{i + 1}</span>
                      <span>{s.titleLv}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <Link
              href={`/modulis/${topic.module.id}/trenins`}
              className="mt-5 flex items-center gap-2 text-[15px] text-muted hover:text-accent-strong"
            >
              <Target aria-hidden="true" className="size-4" /> Moduļa treniņš
            </Link>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            <span>Tēma {topic.id}</span>
            {lesson && (
              <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                <Clock aria-hidden="true" className="size-4" /> {lesson.minutes}{" "}
                min
              </span>
            )}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">
            {topic.titleLv}
          </h1>
          {lesson && lesson.title !== topic.titleLv && (
            <p className="mt-4 text-lg text-muted">{lesson.title}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/tema/${topicSlug(topic.id)}/trenins`}
              className="btn-primary"
            >
              {t("practice", { count: questions.length })}
            </Link>
          </div>

          <nav
            aria-label="Tēmas sadaļas"
            className="mt-8 flex gap-1 border-b border-line"
          >
            {[
              {
                key: "lesson",
                href: `/tema/${topicSlug(topic.id)}`,
                label: "Nodarbība",
              },
              {
                key: "questions",
                href: `/tema/${topicSlug(topic.id)}?cilne=jautajumi`,
                label: `${t("questionsHeading")} (${questions.length})`,
              },
            ].map((it) => (
              <Link
                key={it.key}
                href={it.href}
                scroll={false}
                aria-current={tab === it.key ? "page" : undefined}
                className={`-mb-px inline-flex min-h-12 items-center border-b-2 px-4 text-[15px] ${tab === it.key ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}
              >
                {it.label}
              </Link>
            ))}
          </nav>

          {tab === "lesson" && (
            <>
              {headings.length > 1 && (
                <nav
                  aria-labelledby="toc-h"
                  className="mt-8 border-l-2 border-brand pl-5"
                >
                  <p
                    id="toc-h"
                    className="text-xs font-semibold uppercase tracking-[0.16em] text-muted"
                  >
                    Šajā nodarbībā
                  </p>
                  <ol className="mt-3 space-y-2 text-[15px]">
                    {headings.map((h, i) => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className="hover:text-accent-strong hover:underline"
                        >
                          {i + 1}. {h.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <section className="mt-8" aria-label="Nodarbība">
                {lesson ? (
                  <>
                    <LessonBody markdown={lessonBody ?? ""} />
                    {!allowed && (
                      <div className="mt-8">
                        <Paywall title="Visa nodarbība pieejama ar pilnu piekļuvi" />
                      </div>
                    )}
                    <p className="mt-10 border-t border-line pt-4 text-sm text-muted">
                      <span className="font-semibold text-ink">
                        {t("lessonSources")}:
                      </span>{" "}
                      {lesson.sources}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t("lessonDraft")}
                    </p>
                    {allowed && (
                      <div className="mt-8 rounded-2xl bg-accent-soft p-6">
                        <p className="text-xl font-semibold tracking-tight">
                          Pārbaudi, ko atceries
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {questions.length} jautājumi par šo tēmu, ar
                          skaidrojumu pēc katras atbildes.
                        </p>
                        <Link
                          href={`/tema/${topicSlug(topic.id)}/trenins`}
                          className="btn-primary mt-4 gap-2"
                        >
                          {t("practiceAfterLesson", {
                            count: questions.length,
                          })}{" "}
                          <ArrowUpRight aria-hidden="true" className="size-4" />
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted">{t("lessonSoon")}</p>
                )}
              </section>
            </>
          )}

          {tab === "questions" && (
            <section aria-label={t("questionsHeading")} className="mt-6">
              <ol className="divide-y divide-line">
                {questions.map((q) => (
                  <li key={q.id} className="py-5">
                    <div>
                      <div>
                        <p className="font-semibold" lang="lv">
                          <span className="mr-2 font-normal tabular-nums text-muted">{q.id}.</span>
                          {q.text}
                          {q.familyId && (
                            <span className="ml-2 inline-block rounded-full bg-accent-soft px-2 py-0.5 align-middle text-xs font-normal text-accent-strong">
                              {t("similarBadge")}
                            </span>
                          )}
                        </p>
                        <ul className="mt-2 space-y-1.5" lang="lv">
                          {q.options.map((o) => {
                            const correct = allowed && o.key === q.correctKey;
                            return (
                              <li
                                key={o.key}
                                className={`flex gap-2 rounded-lg px-3 py-2 text-[15px] ${correct ? "bg-ok-soft text-ink" : "bg-surface text-muted"}`}
                              >
                                {correct ? (
                                  <Check
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-ok"
                                    strokeWidth={3}
                                  />
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    className="mt-2 size-1.5 shrink-0 rounded-full bg-muted/40"
                                  />
                                )}
                                <span>
                                  {o.text}
                                  {correct && (
                                    <span className="sr-only">
                                      {" "}
                                      (pareizā atbilde)
                                    </span>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        {allowed && (
                          <Link
                            href={`/jautajums/${q.id}`}
                            className="mt-2 inline-block text-sm font-semibold text-accent-strong hover:underline"
                          >
                            Skaidrojums →
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <nav
            className="mt-10 flex flex-wrap justify-between gap-3 text-sm"
            aria-label="Tēmas"
          >
            {prev ? (
              <Link className="btn-ghost" href={`/tema/${topicSlug(prev.id)}`}>
                ← {prev.titleLv}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link className="btn-ghost" href={`/tema/${topicSlug(next.id)}`}>
                {next.titleLv} →
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
