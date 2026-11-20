import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, or, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";

const { orders, user, questions, questionOptions, topics, answers } = schema;

export type OrderStatus = (typeof schema.orderStatus.enumValues)[number];
export type ExplanationStatus = (typeof schema.explanationStatus.enumValues)[number];

/** Pārskata skaitļi administratora sākumlapai. */
export async function getStats(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const [[users], [newUsers], byStatus, [revenue], byExplanation] = await Promise.all([
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(user).where(gte(user.createdAt, weekAgo)),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db.select({ cents: sum(orders.amountCents) }).from(orders).where(eq(orders.status, "paid")),
    db.select({ status: questions.explanationStatus, n: count() }).from(questions).groupBy(questions.explanationStatus),
  ]);
  const st = Object.fromEntries(byStatus.map((r) => [r.status, Number(r.n)])) as Partial<Record<OrderStatus, number>>;
  const ex = Object.fromEntries(byExplanation.map((r) => [r.status, Number(r.n)])) as Partial<Record<ExplanationStatus, number>>;
  return {
    users: Number(users.n),
    newUsers: Number(newUsers.n),
    paid: st.paid ?? 0,
    refunded: st.refunded ?? 0,
    pending: st.pending ?? 0,
    revenueCents: Number(revenue.cents ?? 0),
    reviewed: ex.reviewed ?? 0,
    draft: ex.draft ?? 0,
  };
}

/** Pasūtījumi ar pircēja e-pastu; filtrs pēc statusa un meklēšana (e-pasts, vārds, rēķina Nr.). */
export async function listOrders({ status, q, limit = 100 }: { status?: OrderStatus; q?: string; limit?: number } = {}) {
  const where = [] as ReturnType<typeof eq>[];
  if (status) where.push(eq(orders.status, status));
  if (q?.trim()) {
    const like = `%${q.trim()}%`;
    where.push(or(ilike(user.email, like), ilike(orders.invoiceNumber, like), sql`${orders.buyer}->>'name' ilike ${like}`)!);
  }
  return db
    .select({ order: orders, email: user.email })
    .from(orders)
    .innerJoin(user, eq(user.id, orders.userId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

/** Lietotāji ar piekļuves statusu un atbilžu skaitu. */
export async function listUsers({ q, limit = 100 }: { q?: string; limit?: number } = {}) {
  const like = q?.trim() ? `%${q.trim()}%` : null;
  const rows = await db
    .select({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt })
    .from(user)
    .where(like ? or(ilike(user.email, like), ilike(user.name, like)) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(limit);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [paid, answered] = await Promise.all([
    db.selectDistinct({ userId: orders.userId }).from(orders).where(and(inArray(orders.userId, ids), eq(orders.status, "paid"))),
    db
      .select({ userId: answers.userId, n: count(), last: sql<Date>`max(${answers.answeredAt})` })
      .from(answers)
      .where(inArray(answers.userId, ids))
      .groupBy(answers.userId),
  ]);
  const paidSet = new Set(paid.map((p) => p.userId));
  const ans = new Map(answered.map((a) => [a.userId, a]));
  return rows.map((r) => ({
    ...r,
    access: paidSet.has(r.id),
    answers: Number(ans.get(r.id)?.n ?? 0),
    lastActive: ans.get(r.id)?.last ? new Date(ans.get(r.id)!.last) : null,
  }));
}

/** Jautājumi skaidrojumu pārbaudei. */
export async function listQuestionsForReview({ status, moduleId }: { status?: ExplanationStatus; moduleId?: string } = {}) {
  const where = [] as ReturnType<typeof eq>[];
  if (status) where.push(eq(questions.explanationStatus, status));
  if (moduleId) where.push(eq(topics.moduleId, moduleId));
  return db
    .select({
      id: questions.id,
      text: questions.text,
      topicId: questions.topicId,
      status: questions.explanationStatus,
      hasExplanation: sql<boolean>`${questions.explanation} is not null`,
      possiblyOutdated: questions.possiblyOutdated,
    })
    .from(questions)
    .innerJoin(topics, eq(topics.id, questions.topicId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(topics.order), asc(questions.id));
}

export async function getQuestionForReview(id: number) {
  const q = await db.query.questions.findFirst({ where: eq(questions.id, id) });
  if (!q) return null;
  const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, id)).orderBy(asc(questionOptions.position));
  return { ...q, options };
}

export interface ExplanationInput {
  explanation: string | null;
  lawReference: string | null;
  outdatedNote: string | null;
  status: ExplanationStatus;
}

/** Saglabā skaidrojumu. Statuss "reviewed" nozīmē: sēklošana to vairs nepārrakstīs. */
export async function saveExplanation(id: number, input: ExplanationInput) {
  const [row] = await db
    .update(questions)
    .set({
      explanation: input.explanation?.trim() || null,
      lawReference: input.lawReference?.trim() || null,
      outdatedNote: input.outdatedNote?.trim() || null,
      possiblyOutdated: Boolean(input.outdatedNote?.trim()),
      explanationStatus: input.status,
      updatedAt: new Date(),
    })
    .where(eq(questions.id, id))
    .returning({ id: questions.id });
  return row ?? null;
}

export async function listModules() {
  return db.select({ id: schema.modules.id, order: schema.modules.order, title: schema.modules.titleLv }).from(schema.modules).orderBy(asc(schema.modules.order));
}
