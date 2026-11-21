import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { answers, questions } = schema;

/** Cik reizes lietotājs kļūdījies katrā jautājumā (tikai jautājumi ar ≥1 kļūdu; eksāmens ieskaitot). */
export async function getMistakeCounts(userId: string) {
  const rows = await db
    .select({ questionId: answers.questionId, wrong: sql<number>`count(*) filter (where not ${answers.isCorrect})::int` })
    .from(answers)
    .where(eq(answers.userId, userId))
    .groupBy(answers.questionId)
    .having(sql`count(*) filter (where not ${answers.isCorrect}) > 0`);
  return new Map(rows.map((r) => [r.questionId, Number(r.wrong)]));
}

/** Kļūdaino jautājumu skaits pa tēmām (izvēles sarakstam). */
export async function getMistakesByTopic(userId: string) {
  const counts = await getMistakeCounts(userId);
  if (!counts.size) return new Map<string, number>();
  const rows = await db.select({ id: questions.id, topicId: questions.topicId }).from(questions).where(inArray(questions.id, [...counts.keys()]));
  const byTopic = new Map<string, number>();
  for (const r of rows) byTopic.set(r.topicId, (byTopic.get(r.topicId) ?? 0) + 1);
  return byTopic;
}

export interface TrainingOptions {
  topicIds: string[];
  mistakesOnly: boolean;
  /** 0 = visi */
  limit: number;
}

/**
 * Treniņa jautājumi no izvēlētajām tēmām.
 * “Tikai kļūdas” — jautājumi, kuros lietotājs kļūdījies, biežāk kļūdainie vispirms; citādi — nejauša izlase.
 */
export async function buildTraining(userId: string, o: TrainingOptions, rand: () => number = Math.random) {
  if (!o.topicIds.length) return [];
  const rows = await db.select({ id: questions.id }).from(questions).where(and(inArray(questions.topicId, o.topicIds)));
  let ids = rows.map((r) => r.id);
  if (o.mistakesOnly) {
    const counts = await getMistakeCounts(userId);
    ids = ids.filter((id) => counts.has(id)).sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a - b);
  } else {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  }
  return o.limit > 0 ? ids.slice(0, o.limit) : ids;
}

/** URL parametri → iestatījumi (drošs parsējums). */
export function parseTrainingParams(sp: { temas?: string; kludas?: string; skaits?: string }): TrainingOptions {
  const topicIds = (sp.temas ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => /^\d{1,2}\.\d{1,2}$/.test(t))
    .slice(0, 60);
  const n = Number(sp.skaits);
  return { topicIds, mistakesOnly: sp.kludas === "1", limit: [10, 20, 40].includes(n) ? n : 0 };
}
