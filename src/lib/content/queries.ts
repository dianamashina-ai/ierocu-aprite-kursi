import "server-only";
import { asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { DEFAULT_CONTENT_VERSION } from "@/config/exam";
import type { PracticeQuestion } from "@/lib/quiz/types";

const { modules, topics, questions, questionOptions, appSettings } = schema;

/** "4.2" ↔ "4-2" (punkts URL ceļā nav vēlams) */
export const topicSlug = (id: string) => id.replace(".", "-");
export const topicIdFromSlug = (slug: string) => slug.replace("-", ".");

export async function getCourseOverview() {
  const [mods, tops, qCounts] = await Promise.all([
    db.select().from(modules).orderBy(asc(modules.order)),
    db.select().from(topics).orderBy(asc(topics.order)),
    db.select({ topicId: questions.topicId, n: count() }).from(questions).groupBy(questions.topicId),
  ]);
  const perTopic = new Map(qCounts.map((r) => [r.topicId, Number(r.n)]));

  const result = mods.map((m) => {
    const mt = tops.filter((t) => t.moduleId === m.id).map((t) => ({ ...t, questionCount: perTopic.get(t.id) ?? 0 }));
    return { ...m, topics: mt, questionCount: mt.reduce((s, t) => s + t.questionCount, 0) };
  });

  return {
    modules: result,
    totals: {
      modules: mods.length,
      topics: tops.length,
      questions: [...perTopic.values()].reduce((a, b) => a + b, 0),
    },
  };
}

export async function getModule(id: string) {
  const course = await getCourseOverview();
  const idx = course.modules.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  return { module: course.modules[idx], prev: course.modules[idx - 1] ?? null, next: course.modules[idx + 1] ?? null };
}

export async function getTopic(id: string) {
  const course = await getCourseOverview();
  const flat = course.modules.flatMap((m) => m.topics.map((t) => ({ ...t, module: m })));
  const idx = flat.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const qs = await db
    .select({ id: questions.id, text: questions.text, familyId: questions.familyId, correctKey: questions.correctKey, explanation: questions.explanation, explanationStatus: questions.explanationStatus })
    .from(questions)
    .where(eq(questions.topicId, id))
    .orderBy(asc(questions.id));
  const opts = qs.length
    ? await db
        .select({ questionId: questionOptions.questionId, key: questionOptions.key, text: questionOptions.text })
        .from(questionOptions)
        .where(inArray(questionOptions.questionId, qs.map((q) => q.id)))
        .orderBy(asc(questionOptions.questionId), asc(questionOptions.position))
    : [];
  const withOptions = qs.map((q) => ({ ...q, options: opts.filter((o) => o.questionId === q.id) }));
  return { topic: flat[idx], questions: withOptions, prev: flat[idx - 1] ?? null, next: flat[idx + 1] ?? null };
}

export type { PracticeQuestion };

async function loadPracticeQuestions(where: SQL) {
  const qs = await db.select().from(questions).where(where).orderBy(asc(questions.id));
  if (!qs.length) return [];
  const ids = qs.map((q) => q.id);
  const familyIds = [...new Set(qs.map((q) => q.familyId).filter((f): f is number => f !== null))];
  const [opts, famSizes] = await Promise.all([
    db
      .select()
      .from(questionOptions)
      .where(inArray(questionOptions.questionId, ids))
      .orderBy(asc(questionOptions.questionId), asc(questionOptions.position)),
    familyIds.length
      ? db
          .select({ familyId: questions.familyId, n: count() })
          .from(questions)
          .where(inArray(questions.familyId, familyIds))
          .groupBy(questions.familyId)
      : Promise.resolve([]),
  ]);
  const sizes = new Map(famSizes.map((r) => [r.familyId, Number(r.n)]));
  const byQ = new Map<number, { key: string; text: string }[]>();
  for (const o of opts) {
    if (!byQ.has(o.questionId)) byQ.set(o.questionId, []);
    byQ.get(o.questionId)!.push({ key: o.key, text: o.text });
  }
  return qs.map<PracticeQuestion>((q) => ({
    id: q.id,
    topicId: q.topicId,
    text: q.text,
    options: byQ.get(q.id) ?? [],
    correctKey: q.correctKey,
    explanation: q.explanation,
    explanationStatus: q.explanationStatus,
    lawReference: q.lawReference,
    possiblyOutdated: q.possiblyOutdated,
    outdatedNote: q.outdatedNote,
    shuffleDisabled: q.shuffleDisabled,
    familyId: q.familyId,
    familySize: q.familyId ? (sizes.get(q.familyId) ?? 1) : 1,
    sourcePage: q.sourcePage,
  }));
}

export function getPracticeQuestionsForTopic(topicId: string) {
  return loadPracticeQuestions(eq(questions.topicId, topicId));
}

export async function getPracticeQuestion(id: number) {
  const [q] = await loadPracticeQuestions(eq(questions.id, id));
  return q ?? null;
}

export async function getPracticeQuestionsByIds(ids: number[]) {
  if (!ids.length) return [];
  return loadPracticeQuestions(inArray(questions.id, ids));
}

export async function getFamily(familyId: number) {
  return loadPracticeQuestions(eq(questions.familyId, familyId));
}

export async function getTopicMeta(topicId: string) {
  const row = await db
    .select({ id: topics.id, titleLv: topics.titleLv, moduleId: topics.moduleId, moduleTitle: modules.titleLv, moduleOrder: modules.order })
    .from(topics)
    .innerJoin(modules, eq(modules.id, topics.moduleId))
    .where(eq(topics.id, topicId));
  return row[0] ?? null;
}

export async function searchQuestions(query: string, limit = 50) {
  const q = query.trim();
  if (!q) return [];
  if (/^\d{1,3}$/.test(q)) {
    return db
      .select({ id: questions.id, text: questions.text, topicId: questions.topicId })
      .from(questions)
      .where(eq(questions.id, Number(q)));
  }
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const matchingOptions = db
    .selectDistinct({ id: questionOptions.questionId })
    .from(questionOptions)
    .where(ilike(questionOptions.text, pattern));
  return db
    .select({ id: questions.id, text: questions.text, topicId: questions.topicId })
    .from(questions)
    .where(or(ilike(questions.text, pattern), inArray(questions.id, matchingOptions)))
    .orderBy(asc(questions.id))
    .limit(limit);
}

export async function getContentVersion(): Promise<string> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, "content_version") });
  return typeof row?.value === "string" ? row.value : DEFAULT_CONTENT_VERSION;
}

export async function getPracticeQuestionsForModule(moduleId: string) {
  const ids = db.select({ id: topics.id }).from(topics).where(eq(topics.moduleId, moduleId));
  return loadPracticeQuestions(inArray(questions.topicId, ids));
}
