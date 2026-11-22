import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { DEFAULT_EXAM_CONFIG, type ExamConfig } from "@/config/exam";
import { nextReviewState } from "./review";
import { nextMastery } from "./mastery";
import { currentStreak, rigaDay } from "./streak";
import { EXAMS_UNLOCK_PERCENT, readiness } from "./readiness";
import { sampleExam } from "@/lib/exam/sample";

const { answers, questionProgress, questions, questionOptions, topics, modules, examAttempts, appSettings, userMilestones } = schema;

let totalQuestionsCache: number | null = null;

/** Ja lietotājs pirmo reizi sasniedzis EXAMS_UNLOCK_PERCENT progresa — piefiksē brīdi. */
async function maybeUnlockExams(t: Tx, userId: string, now: Date) {
  const [has] = await t.select({ u: userMilestones.userId }).from(userMilestones).where(eq(userMilestones.userId, userId));
  if (has) return;
  if (totalQuestionsCache === null) {
    const [r] = await t.select({ n: sql<number>`count(*)::int` }).from(questions);
    totalQuestionsCache = Number(r.n);
  }
  const [m] = await t
    .select({ n: sql<number>`count(*)::int` })
    .from(questionProgress)
    .where(and(eq(questionProgress.userId, userId), eq(questionProgress.mastered, true)));
  if (totalQuestionsCache > 0 && Math.round((Number(m.n) / totalQuestionsCache) * 100) >= EXAMS_UNLOCK_PERCENT) {
    await t.insert(userMilestones).values({ userId, examsUnlockedAt: now }).onConflictDoNothing();
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Mode = "practice" | "review" | "exam";

export class ProgressError extends Error {}

/**
 * Saglabā atbildi un atjauno progresu. Pareizību nosaka serveris (klientam neuzticamies).
 */
export async function recordAnswer(
  userId: string,
  questionId: number,
  selectedKey: string,
  mode: Mode,
  { examAttemptId = null, now = new Date(), tx }: { examAttemptId?: string | null; now?: Date; tx?: Tx } = {},
) {
  const run = async (t: Tx) => {
    const [q] = await t
      .select({ correctKey: questions.correctKey })
      .from(questions)
      .where(eq(questions.id, questionId));
    if (!q) throw new ProgressError("Jautājums nav atrasts");
    const [opt] = await t
      .select({ key: questionOptions.key })
      .from(questionOptions)
      .where(and(eq(questionOptions.questionId, questionId), eq(questionOptions.key, selectedKey)));
    if (!opt) throw new ProgressError("Nederīgs atbildes variants");

    const isCorrect = selectedKey === q.correctKey;
    await t.insert(answers).values({ userId, questionId, selectedKey, isCorrect, mode, examAttemptId, answeredAt: now });

    const [prev] = await t
      .select()
      .from(questionProgress)
      .where(and(eq(questionProgress.userId, userId), eq(questionProgress.questionId, questionId)))
      .for("update");
    const review = nextReviewState(prev ? { reviewStage: prev.reviewStage, nextReviewAt: prev.nextReviewAt } : null, isCorrect, now);
    const mastery = nextMastery(prev ? { mastered: prev.mastered, streak: prev.streak } : null, isCorrect);

    if (prev) {
      await t
        .update(questionProgress)
        .set({
          attempts: prev.attempts + 1,
          correctCount: prev.correctCount + (isCorrect ? 1 : 0),
          lastCorrect: isCorrect,
          lastAnsweredAt: now,
          ...mastery,
          ...review,
        })
        .where(and(eq(questionProgress.userId, userId), eq(questionProgress.questionId, questionId)));
    } else {
      await t.insert(questionProgress).values({
        userId,
        questionId,
        attempts: 1,
        correctCount: isCorrect ? 1 : 0,
        lastCorrect: isCorrect,
        lastAnsweredAt: now,
        ...mastery,
        ...review,
      });
    }
    await maybeUnlockExams(t, userId, now);
    return { isCorrect, correctKey: q.correctKey };
  };
  return tx ? run(tx) : db.transaction(run);
}

/** Jautājumi, kuru atkārtošana ir pienākusi. */
export async function getDueReviewIds(userId: string, now = new Date()) {
  const rows = await db
    .select({ id: questionProgress.questionId })
    .from(questionProgress)
    .where(and(eq(questionProgress.userId, userId), isNotNull(questionProgress.nextReviewAt), lte(questionProgress.nextReviewAt, now)))
    .orderBy(asc(questionProgress.nextReviewAt));
  return rows.map((r) => r.id);
}

/** Nākamās (vēl nepienākušās) atkārtošanas, grupētas pa dienām. */
export async function getUpcomingReviews(userId: string, now = new Date()) {
  const rows = await db
    .select({ id: questionProgress.questionId, at: questionProgress.nextReviewAt })
    .from(questionProgress)
    .where(and(eq(questionProgress.userId, userId), gt(questionProgress.nextReviewAt, now)))
    .orderBy(asc(questionProgress.nextReviewAt));
  const byDay = new Map<string, number>();
  for (const r of rows) byDay.set(rigaDay(r.at!), (byDay.get(rigaDay(r.at!)) ?? 0) + 1);
  return [...byDay].map(([day, count]) => ({ day, count }));
}

/** Visi jautājumi, kuros pēdējā atbilde bija nepareiza. */
export async function getWrongIds(userId: string) {
  const rows = await db
    .select({ id: questionProgress.questionId })
    .from(questionProgress)
    .where(and(eq(questionProgress.userId, userId), eq(questionProgress.lastCorrect, false)))
    .orderBy(desc(questionProgress.lastAnsweredAt));
  return rows.map((r) => r.id);
}

// ── Izmēģinājuma eksāmens ──────────────────────────────────────

export async function getExamConfig(): Promise<ExamConfig> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, "exam") });
  const v = (row?.value ?? {}) as Partial<ExamConfig>;
  return { ...DEFAULT_EXAM_CONFIG, ...v };
}

const GRACE_MS = 60_000; // tīkla aizkavēm

export function examDeadline(a: { startedAt: Date; durationMinutes: number }) {
  return new Date(a.startedAt.getTime() + a.durationMinutes * 60_000);
}

/** Nepabeigts eksāmens, kuram vēl nav beidzies laiks (lai sākumlapā rādītu “Turpināt”). */
export async function getOpenExam(userId: string, now = new Date()) {
  const [a] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.userId, userId), eq(examAttempts.status, "in_progress")))
    .orderBy(desc(examAttempts.startedAt))
    .limit(1);
  if (!a) return null;
  const deadline = examDeadline(a);
  if (deadline.getTime() <= now.getTime()) return null;
  return { id: a.id, deadline, answered: Object.keys(a.selected).length, total: a.questionIds.length };
}

export async function startExam(userId: string, now = new Date()) {
  const open = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.userId, userId), eq(examAttempts.status, "in_progress")))
    .orderBy(desc(examAttempts.startedAt));
  for (const a of open) {
    if (examDeadline(a).getTime() + GRACE_MS > now.getTime()) return a.id; // turpina nepabeigto
    await finishExam(userId, a.id, now);
  }
  const cfg = await getExamConfig();
  const all = await db.select({ id: questions.id, officialSectionId: questions.officialSectionId }).from(questions);
  const seed = randomUUID();
  const id = randomUUID();
  await db.insert(examAttempts).values({
    id,
    userId,
    questionIds: sampleExam(all, Math.min(cfg.questionCount, all.length), seed),
    seed,
    durationMinutes: cfg.durationMinutes,
    passPercent: cfg.passPercent,
    startedAt: now,
  });
  return id;
}

async function loadAttempt(userId: string, attemptId: string) {
  const [a] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.userId, userId)));
  return a ?? null;
}

export async function saveExamAnswer(userId: string, attemptId: string, questionId: number, key: string, now = new Date()) {
  const a = await loadAttempt(userId, attemptId);
  if (!a) throw new ProgressError("Eksāmens nav atrasts");
  if (a.status !== "in_progress") throw new ProgressError("Eksāmens jau ir pabeigts");
  if (examDeadline(a).getTime() + GRACE_MS < now.getTime()) {
    await finishExam(userId, attemptId, now);
    throw new ProgressError("Laiks ir beidzies");
  }
  if (!a.questionIds.includes(questionId)) throw new ProgressError("Jautājums nav šajā eksāmenā");
  if (!/^[a-f]$/.test(key)) throw new ProgressError("Nederīgs variants");
  await db
    .update(examAttempts)
    .set({ selected: sql`${examAttempts.selected} || ${JSON.stringify({ [questionId]: key })}::jsonb` })
    .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.status, "in_progress")));
}

/** Pabeidz eksāmenu (idempotenti): aprēķina rezultātu, saglabā atbildes progresā. */
export async function finishExam(userId: string, attemptId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const [a] = await tx
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.userId, userId)))
      .for("update");
    if (!a) throw new ProgressError("Eksāmens nav atrasts");
    if (a.status === "finished") return a;

    const deadline = examDeadline(a);
    const finishedAt = now.getTime() > deadline.getTime() ? deadline : now;
    let correct = 0;
    for (const qid of a.questionIds) {
      const key = a.selected[String(qid)];
      if (!key) continue; // neatbildēts = nepareizi
      const r = await recordAnswer(userId, qid, key, "exam", { examAttemptId: a.id, now: finishedAt, tx });
      if (r.isCorrect) correct++;
    }
    const passed = (correct / a.questionIds.length) * 100 >= a.passPercent;
    const [done] = await tx
      .update(examAttempts)
      .set({ status: "finished", finishedAt, correctCount: correct, passed })
      .where(eq(examAttempts.id, a.id))
      .returning();
    return done;
  });
}

export async function getExamAttempt(userId: string, attemptId: string, now = new Date()) {
  let a = await loadAttempt(userId, attemptId);
  if (!a) return null;
  if (a.status === "in_progress" && examDeadline(a).getTime() + GRACE_MS < now.getTime()) {
    a = await finishExam(userId, attemptId, now);
  }
  return a;
}

export async function getExamHistory(userId: string, limit = 20) {
  return db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.userId, userId), eq(examAttempts.status, "finished")))
    .orderBy(desc(examAttempts.finishedAt))
    .limit(limit);
}

// ── Panelis ────────────────────────────────────────────────────

/** Pēdējās n dienas (vecākā pirmā): vai tajā dienā bija atbildes. */
function lastDays(days: string[], today: string, n: number) {
  const set = new Set(days);
  const base = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base.getTime() - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, active: set.has(d) };
  });
}

export async function getDashboard(userId: string, now = new Date()) {
  const [mods, tops, perTopic, progressByTopic, dayRows, due, allHistory, milestone] = await Promise.all([
    db.select().from(modules).orderBy(asc(modules.order)),
    db.select().from(topics).orderBy(asc(topics.order)),
    db.select({ topicId: questions.topicId, n: sql<number>`count(*)::int` }).from(questions).groupBy(questions.topicId),
    db
      .select({
        topicId: questions.topicId,
        answered: sql<number>`count(*)::int`,
        mastered: sql<number>`count(*) filter (where ${questionProgress.mastered})::int`,
        wrong: sql<number>`count(*) filter (where not ${questionProgress.lastCorrect})::int`,
        /** pareizi atbildēti, bet vēl nav 2× pēc kārtas */
        learning: sql<number>`count(*) filter (where ${questionProgress.lastCorrect} and not ${questionProgress.mastered})::int`,
      })
      .from(questionProgress)
      .innerJoin(questions, eq(questions.id, questionProgress.questionId))
      .where(eq(questionProgress.userId, userId))
      .groupBy(questions.topicId),
    db
      .selectDistinct({ day: sql<string>`to_char(${answers.answeredAt} at time zone 'Europe/Riga', 'YYYY-MM-DD')` })
      .from(answers)
      .where(and(eq(answers.userId, userId), gt(answers.answeredAt, new Date(now.getTime() - 400 * 86_400_000)))),
    getDueReviewIds(userId, now),
    getExamHistory(userId, 10),
    db.select({ at: userMilestones.examsUnlockedAt }).from(userMilestones).where(eq(userMilestones.userId, userId)),
  ]);
  // Eksāmeni skaitās tikai pēc tam, kad sasniegts EXAMS_UNLOCK_PERCENT progresa (agrāki “paskatīšanās” mēģinājumi neskaitās)
  const examsUnlockedAt = milestone[0]?.at ?? null;
  const history = examsUnlockedAt ? allHistory.filter((e) => e.finishedAt && e.finishedAt > examsUnlockedAt) : [];

  const totals = new Map(perTopic.map((r) => [r.topicId, r.n]));
  const prog = new Map(progressByTopic.map((r) => [r.topicId, r]));
  const topicStats = tops.map((t) => {
    const total = totals.get(t.id) ?? 0;
    const p = prog.get(t.id);
    const answered = p?.answered ?? 0;
    const mastered = p?.mastered ?? 0;
    const wrong = p?.wrong ?? 0;
    const learning = p?.learning ?? 0;
    return {
      id: t.id,
      moduleId: t.moduleId,
      title: t.titleLv,
      total,
      answered,
      mastered,
      percent: total ? Math.round((mastered / total) * 100) : 0,
      wrong,
      learning,
      accuracy: answered ? (answered - wrong) / answered : null,
    };
  });
  const moduleStats = mods.map((m) => {
    const ts = topicStats.filter((t) => t.moduleId === m.id);
    const total = ts.reduce((s, t) => s + t.total, 0);
    const mastered = ts.reduce((s, t) => s + t.mastered, 0);
    const learning = ts.reduce((s, t) => s + t.learning, 0);
    return { id: m.id, order: m.order, title: m.titleLv, total, mastered, learning, percent: total ? Math.round((mastered / total) * 100) : 0, topics: ts };
  });
  const totalQuestions = topicStats.reduce((s, t) => s + t.total, 0);
  const answeredQuestions = topicStats.reduce((s, t) => s + t.answered, 0);
  const weakTopics = topicStats
    .filter((t) => t.answered >= 3 && t.accuracy !== null && t.accuracy < 0.7)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
    .slice(0, 3);

  return {
    modules: moduleStats,
    totalQuestions,
    answeredQuestions,
    unanswered: totalQuestions - answeredQuestions,
    masteredQuestions: topicStats.reduce((s, t) => s + t.mastered, 0),
    learningQuestions: topicStats.reduce((s, t) => s + t.learning, 0),
    /** pašreizējās kļūdas: pēdējā atbilde nepareiza */
    mistakes: topicStats.reduce((s, t) => s + t.wrong, 0),
    streak: currentStreak(dayRows.map((r) => r.day), rigaDay(now)),
    week: lastDays(dayRows.map((r) => r.day), rigaDay(now), 7),
    dueReviews: due.length,
    weakTopics,
    /** izmēģinājuma eksāmeni kopš EXAMS_UNLOCK_PERCENT sasniegšanas (jaunākais pirmais) */
    exams: history,
    examsUnlocked: examsUnlockedAt !== null,
    readiness: readiness({
      recentExams: history.map((e) => ({ passed: Boolean(e.passed) })),
      topicPercents: topicStats.map((t) => ({ topicId: t.id, percent: t.percent })),
    }),
  };
}

/** Lietotāja pēdējā atbilde katram jautājumam no saraksta (rezultātu skatam). */
export async function getProgressFor(userId: string, ids: number[]) {
  if (!ids.length) return new Map<number, boolean>();
  const rows = await db
    .select({ id: questionProgress.questionId, lastCorrect: questionProgress.lastCorrect })
    .from(questionProgress)
    .where(and(eq(questionProgress.userId, userId), inArray(questionProgress.questionId, ids)));
  return new Map(rows.map((r) => [r.id, r.lastCorrect]));
}

/** Apgūto jautājumu skaits pa tēmām (kursa un moduļa lapām). */
export async function getTopicProgress(userId: string) {
  const rows = await db
    .select({
      topicId: questions.topicId,
      answered: sql<number>`count(*)::int`,
      mastered: sql<number>`count(*) filter (where ${questionProgress.mastered})::int`,
      learning: sql<number>`count(*) filter (where ${questionProgress.lastCorrect} and not ${questionProgress.mastered})::int`,
    })
    .from(questionProgress)
    .innerJoin(questions, eq(questions.id, questionProgress.questionId))
    .where(eq(questionProgress.userId, userId))
    .groupBy(questions.topicId);
  return new Map(rows.map((r) => [r.topicId, { answered: r.answered, mastered: r.mastered, learning: r.learning }]));
}
