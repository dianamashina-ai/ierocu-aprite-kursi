import "server-only";
import { COURSE_ACCESS_CODES, LESSON_CODES, type ProductCode } from "@/config/pricing";
import { and, asc, count, desc, eq, gte, ilike, inArray, ne, or, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { activeSessions, deviceCounts, recentLogins, SHARING_DEVICE_THRESHOLD } from "@/lib/auth/devices";

const { orders, user, questions, questionOptions, topics, answers } = schema;

export type OrderStatus = (typeof schema.orderStatus.enumValues)[number];
export type ExplanationStatus = (typeof schema.explanationStatus.enumValues)[number];

/** Pārskata skaitļi administratora sākumlapai. */
export async function getStats(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const [[users], [newUsers], byStatus, [revenue], byExplanation, [manual]] = await Promise.all([
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(user).where(gte(user.createdAt, weekAgo)),
    db.select({ status: orders.status, n: count() }).from(orders).where(ne(orders.provider, "manual")).groupBy(orders.status),
    db.select({ cents: sum(orders.amountCents) }).from(orders).where(and(eq(orders.status, "paid"), ne(orders.provider, "manual"))),
    db.select({ status: questions.explanationStatus, n: count() }).from(questions).groupBy(questions.explanationStatus),
    db.select({ n: count() }).from(orders).where(and(eq(orders.status, "paid"), eq(orders.provider, "manual"))),
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
    manual: Number(manual.n),
  };
}

/** Pasūtījumi ar pircēja e-pastu; filtrs pēc statusa un meklēšana (e-pasts, vārds, rēķina Nr.). */
export async function listOrders({ status, q, lessons = false, limit = 100 }: { status?: OrderStatus; q?: string; lessons?: boolean; limit?: number } = {}) {
  const where = [] as ReturnType<typeof eq>[];
  if (status) where.push(eq(orders.status, status));
  // Praktiskās nodarbības: apmaksātas; vispirms jāsazinās, tad saskaņotās pēc laika, notikušās beigās
  if (lessons) where.push(and(eq(orders.status, "paid"), inArray(orders.productCode, LESSON_CODES))!);
  if (q?.trim()) {
    const like = `%${q.trim()}%`;
    where.push(or(ilike(user.email, like), ilike(orders.invoiceNumber, like), sql`${orders.buyer}->>'name' ilike ${like}`)!);
  }
  return db
    .select({ order: orders, email: user.email })
    .from(orders)
    .innerJoin(user, eq(user.id, orders.userId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(
      ...(lessons
        ? [sql`case ${orders.lessonStatus} when 'refunded' then 3 when 'done' then 2 when 'scheduled' then 1 else 0 end`, asc(orders.lessonAt), desc(orders.createdAt)]
        : [desc(orders.createdAt)]),
    )
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
  const [paid, answered, devices] = await Promise.all([
    db
      .selectDistinct({ userId: orders.userId })
      .from(orders)
      .where(and(inArray(orders.userId, ids), eq(orders.status, "paid"), inArray(orders.productCode, COURSE_ACCESS_CODES))),
    db
      .select({ userId: answers.userId, n: count(), last: sql<Date>`max(${answers.answeredAt})` })
      .from(answers)
      .where(inArray(answers.userId, ids))
      .groupBy(answers.userId),
    deviceCounts(ids),
  ]);
  const paidSet = new Set(paid.map((p) => p.userId));
  const ans = new Map(answered.map((a) => [a.userId, a]));
  return rows.map((r) => ({
    ...r,
    access: paidSet.has(r.id),
    answers: Number(ans.get(r.id)?.n ?? 0),
    lastActive: ans.get(r.id)?.last ? new Date(ans.get(r.id)!.last) : null,
    devices30d: devices.get(r.id) ?? 0,
    possiblyShared: (devices.get(r.id) ?? 0) > SHARING_DEVICE_THRESHOLD,
  }));
}

/** Viena lietotāja kartīte administratoram. */
export async function getUserDetail(id: string) {
  const u = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!u) return null;
  const [userOrders, sessions, logins, devices, [ans]] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt)),
    activeSessions(id),
    recentLogins(id),
    deviceCounts([id]),
    db.select({ n: count() }).from(answers).where(eq(answers.userId, id)),
  ]);
  const devices30d = devices.get(id) ?? 0;
  return {
    user: u,
    orders: userOrders,
    access: userOrders.some((o) => o.status === "paid" && COURSE_ACCESS_CODES.includes(o.productCode as ProductCode)),
    sessions,
    logins,
    answers: Number(ans.n),
    devices30d,
    possiblyShared: devices30d > SHARING_DEVICE_THRESHOLD,
  };
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

/**
 * Dzēš vienu kontu (administrators izvēlas pats). Ja kontam ir rēķini, vajag skaidru apstiprinājumu
 * (`withInvoices`) — tas paredzēts tikai testa maksājumiem pirms palaišanas.
 */
export async function deleteAccount(id: string, opts: { withInvoices?: boolean } = {}) {
  const { user, orders } = schema;
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.id, id));
  if (!u) return { ok: false as const, reason: "Konts nav atrasts" };
  const [{ invoiced }] = await db
    .select({ invoiced: sql<number>`count(${orders.invoiceNumber})::int` })
    .from(orders)
    .where(eq(orders.userId, id));
  if (invoiced > 0 && !opts.withInvoices) return { ok: false as const, reason: `Kontam ir ${invoiced} rēķini`, invoiced };
  await db.transaction(async (tx) => {
    await tx.delete(orders).where(eq(orders.userId, id));
    await tx.delete(user).where(eq(user.id, id));
  });
  return { ok: true as const };
}

export async function getUserEmail(id: string) {
  const [u] = await db.select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.id, id));
  return u ?? null;
}
