import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { DEFAULT_CONTENT_VERSION } from "@/config/exam";

const { modules, topics, questions, appSettings } = schema;

export async function getCourseOverview() {
  const [mods, tops, qCounts] = await Promise.all([
    db.select().from(modules).orderBy(asc(modules.order)),
    db.select().from(topics).orderBy(asc(topics.order)),
    db
      .select({ topicId: questions.topicId, n: count() })
      .from(questions)
      .groupBy(questions.topicId),
  ]);
  const perTopic = new Map(qCounts.map((r) => [r.topicId, Number(r.n)]));

  const result = mods.map((m) => {
    const mt = tops
      .filter((t) => t.moduleId === m.id)
      .map((t) => ({ ...t, questionCount: perTopic.get(t.id) ?? 0 }));
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

export async function getContentVersion(): Promise<string> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, "content_version") });
  return typeof row?.value === "string" ? row.value : DEFAULT_CONTENT_VERSION;
}
