import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { answers, questions, questionProgress, topics } = schema;

/** Cik reizes lietotājs kļūdījies katrā jautājumā (visā vēsturē, eksāmens ieskaitot). */
export async function getMistakeCounts(userId: string) {
  const rows = await db
    .select({ questionId: answers.questionId, wrong: sql<number>`count(*) filter (where not ${answers.isCorrect})::int` })
    .from(answers)
    .where(eq(answers.userId, userId))
    .groupBy(answers.questionId)
    .having(sql`count(*) filter (where not ${answers.isCorrect}) > 0`);
  return new Map(rows.map((r) => [r.questionId, Number(r.wrong)]));
}

/** Pašreizējās kļūdas: jautājumi, uz kuriem pēdējā atbilde bija nepareiza (ar moduli). */
async function currentMistakes(userId: string) {
  return db
    .select({ id: questionProgress.questionId, moduleId: topics.moduleId })
    .from(questionProgress)
    .innerJoin(questions, eq(questions.id, questionProgress.questionId))
    .innerJoin(topics, eq(topics.id, questions.topicId))
    .where(and(eq(questionProgress.userId, userId), eq(questionProgress.lastCorrect, false)));
}

/** Pašreizējo kļūdu skaits pa moduļiem. */
export async function getMistakesByModule(userId: string) {
  const rows = await currentMistakes(userId);
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.moduleId, (m.get(r.moduleId) ?? 0) + 1);
  return m;
}

export interface TrainingOptions {
  /** tukšs = visi moduļi */
  moduleIds: string[];
  mistakesOnly: boolean;
  /** 0 = visi */
  limit: number;
}

/**
 * Treniņa jautājumi no izvēlētajiem moduļiem.
 * “Tikai kļūdas” — jautājumi, uz kuriem pēdējā atbilde bija nepareiza, biežāk kļūdainie vispirms;
 * citādi — nejauša izlase.
 */
export async function buildTraining(userId: string, o: TrainingOptions, rand: () => number = Math.random) {
  const rows = await db
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(topics, eq(topics.id, questions.topicId))
    .where(o.moduleIds.length ? inArray(topics.moduleId, o.moduleIds) : undefined);
  let ids = rows.map((r) => r.id);
  if (o.mistakesOnly) {
    const [wrong, counts] = await Promise.all([currentMistakes(userId), getMistakeCounts(userId)]);
    const wrongSet = new Set(wrong.map((w) => w.id));
    ids = ids.filter((id) => wrongSet.has(id)).sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a - b);
  } else {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  }
  return o.limit > 0 ? ids.slice(0, o.limit) : ids;
}

/** URL parametri → iestatījumi (drošs parsējums). */
export function parseTrainingParams(sp: { moduli?: string; kludas?: string; skaits?: string }): TrainingOptions {
  const moduleIds = (sp.moduli ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => /^M\d{1,2}$/.test(t))
    .slice(0, 20);
  const n = Number(sp.skaits);
  return { moduleIds, mistakesOnly: sp.kludas === "1", limit: [20, 40, 60, 80].includes(n) ? n : 0 };
}
