/**
 * Integrācijas tests: pasūtījumi, apmaksa, rēķinu numerācija, piekļuve (TEST_DATABASE_URL — tiek notīrīta!).
 */
import "dotenv/config";
import { beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

describe.skipIf(!url)("maksājumi (DB)", async () => {
  const { db, schema } = await import("@/db");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { loadContent } = await import("@/lib/content/source");
  const { seedDatabase } = await import("@/lib/content/seed");
  const billing = await import("@/lib/billing/service");
  const access = await import("@/lib/billing/access");
  const buyer = { name: "Jānis Bērziņš", email: "janis@example.com" };
  const t0 = new Date("2026-11-19T10:00:00Z");

  beforeAll(async () => {
    await db.execute(sql`drop schema if exists public cascade; create schema public; drop schema if exists drizzle cascade;`);
    await migrate(db, { migrationsFolder: "drizzle" });
    await seedDatabase(db, loadContent());
    await db.insert(schema.user).values([
      { id: "u1", name: "Jānis", email: "janis@example.com" },
      { id: "u2", name: "Anna", email: "anna@example.com" },
    ]);
  });

  it("bez apmaksas — tikai 1. modulis", async () => {
    expect(await access.hasFullAccess("u1")).toBe(false);
    expect(await access.canAccessModule("u1", "M1")).toBe(true);
    expect(await access.canAccessModule("u1", "M5")).toBe(false);
    expect(await access.canAccessQuestion(null, 422)).toBe(true); // M1
    expect(await access.canAccessQuestion(null, 1)).toBe(false); // M3
  });

  it("pasūtījums: cena, PVN, statuss pending, bez rēķina numura", async () => {
    const o = await billing.createOrder("u1", buyer, { provider: "dev", now: t0 });
    expect(o).toMatchObject({ status: "pending", amountCents: 12000, netCents: 9917, vatCents: 2083, vatRate: 21, invoiceNumber: null });
  });

  it("apmaksa piešķir rēķina numuru un piekļuvi; atkārtots paziņojums neko nemaina", async () => {
    const o = await billing.createOrder("u2", { ...buyer, email: "anna@example.com" }, { provider: "dev", now: t0 });
    const r1 = await billing.applyPaymentEvent({ orderId: o.id, status: "paid" }, "dev", { now: t0 });
    expect(r1).toMatchObject({ changed: true, becamePaid: true });
    expect(r1.order?.invoiceNumber).toBe("IE-2026-00001");
    const r2 = await billing.applyPaymentEvent({ orderId: o.id, status: "paid" }, "dev", { now: t0 });
    expect(r2.changed).toBe(false);
    expect(await access.hasFullAccess("u2")).toBe(true);
    await expect(billing.createOrder("u2", buyer, { provider: "dev" })).rejects.toThrow(/jau ir pilna piekļuve/);
  });

  it("cita maksājumu sistēma nevar apstiprināt pasūtījumu", async () => {
    const o = await billing.createOrder("u1", buyer, { provider: "dev", now: t0 });
    const r = await billing.applyPaymentEvent({ orderId: o.id, status: "paid" }, "stripe");
    expect(r.changed).toBe(false);
    expect(await access.hasFullAccess("u1")).toBe(false);
  });

  it("atcelts pasūtījums nesaņem numuru; nākamais apmaksātais — secīgs numurs", async () => {
    const a = await billing.createOrder("u1", buyer, { provider: "dev", now: t0 });
    await billing.applyPaymentEvent({ orderId: a.id, status: "canceled" }, "dev");
    const b = await billing.createOrder("u1", buyer, { provider: "dev", now: t0 });
    const r = await billing.applyPaymentEvent({ orderId: b.id, status: "paid" }, "dev", { now: t0 });
    expect(r.order?.invoiceNumber).toBe("IE-2026-00002");
  });

  it("pilna atmaksa atņem piekļuvi, rēķina numurs saglabājas", async () => {
    const [o] = await db.select().from(schema.orders).where(sql`${schema.orders.invoiceNumber} = 'IE-2026-00002'`);
    const r = await billing.applyPaymentEvent({ orderId: o.id, status: "refunded" }, "dev");
    expect(r.order).toMatchObject({ status: "refunded", invoiceNumber: "IE-2026-00002" });
    expect(await access.hasFullAccess("u1")).toBe(false);
  });

  it("refundOrder (administrators): atmaksā apmaksātu, slēdz piekļuvi; neapmaksātu — atsaka", async () => {
    const [o] = await db.select().from(schema.orders).where(sql`${schema.orders.invoiceNumber} = 'IE-2026-00001'`);
    const r = await billing.refundOrder(o.id, { now: t0 });
    expect(r.order).toMatchObject({ status: "refunded", invoiceNumber: "IE-2026-00001" });
    expect(await access.hasFullAccess("u2")).toBe(false);
    await expect(billing.refundOrder(o.id)).rejects.toThrow(/tikai apmaksātu/);
    await expect(billing.refundOrder("nav-tada")).rejects.toThrow(/nav atrasts/);
  });

  it("administrācija: pārskats, pasūtījumu un lietotāju saraksti, meklēšana", async () => {
    const admin = await import("@/lib/backoffice/service");
    const s = await admin.getStats(t0);
    expect(s).toMatchObject({ users: 2, paid: 0, refunded: 2, revenueCents: 0 });
    expect(s.reviewed + s.draft).toBe(515);
    const found = await admin.listOrders({ q: "IE-2026-00001" });
    expect(found).toHaveLength(1);
    expect(found[0].email).toBe("anna@example.com");
    expect(await admin.listOrders({ status: "refunded" })).toHaveLength(2);
    const users = await admin.listUsers({ q: "anna" });
    expect(users).toMatchObject([{ email: "anna@example.com", access: false, answers: 0 }]);
  });

  it("administrācija: skaidrojuma saglabāšana un statuss", async () => {
    const admin = await import("@/lib/backoffice/service");
    const before = await admin.getQuestionForReview(422);
    expect(before?.options.length).toBeGreaterThan(1);
    await admin.saveExplanation(422, { explanation: "  Jauns teksts.  ", lawReference: "Ieroču aprites likums, 1. pants", outdatedNote: "", status: "reviewed" });
    const after = await admin.getQuestionForReview(422);
    expect(after).toMatchObject({ explanation: "Jauns teksts.", explanationStatus: "reviewed", possiblyOutdated: false, outdatedNote: null });
    expect((await admin.listQuestionsForReview({ status: "reviewed" })).map((q) => q.id)).toContain(422);
    expect(await admin.saveExplanation(99999, { explanation: null, lawReference: null, outdatedNote: null, status: "draft" })).toBeNull();
  });

  it("manuāla piekļuve: jauns konts tiek izveidots, bez rēķina; atkārtoti — atsaka; atsaukšana slēdz", async () => {
    const r = await billing.grantManualAccess({ email: " Skolens@Example.com ", name: "Skolēns", method: "cash", note: "čeks 15" }, { now: t0 });
    expect(r.created).toBe(true);
    expect(r.order).toMatchObject({ provider: "manual", status: "paid", invoiceNumber: null, amountCents: 12000, note: "Skaidra nauda: čeks 15" });
    expect(r.order.buyer.email).toBe("skolens@example.com");
    expect(await access.hasFullAccess(r.order.userId)).toBe(true);
    await expect(billing.grantManualAccess({ email: "skolens@example.com", method: "free" })).rejects.toThrow(/jau ir pilna piekļuve/);

    const free = await billing.grantManualAccess({ email: "janis@example.com", method: "free" }, { now: t0 });
    expect(free.created).toBe(false);
    expect(free.order).toMatchObject({ userId: "u1", amountCents: 0, note: "Bez maksas" });

    const revoked = await billing.refundOrder(r.order.id);
    expect(revoked.order).toMatchObject({ status: "refunded" });
    expect(await access.hasFullAccess(r.order.userId)).toBe(false);
    await expect(billing.grantManualAccess({ email: "nav-epasts", method: "free" })).rejects.toThrow(/e-pasta/);

    const admin = await import("@/lib/backoffice/service");
    const s = await admin.getStats(t0);
    expect(s.manual).toBe(1); // tikai Jānis (Skolēnam atsaukts); tiešsaistes ieņēmumos manuālie neskaitās
    expect(s.revenueCents).toBe(0);
  });

  it("ierīču ierobežojums: paliek 3 jaunākās sesijas; vēsture skaita ierīces", async () => {
    const devices = await import("@/lib/auth/devices");
    const future = new Date(Date.now() + 86400_000);
    for (let i = 0; i < 4; i++) {
      const created = new Date(Date.now() - (4 - i) * 60_000);
      await db.insert(schema.session).values({ id: `s${i}`, token: `t${i}`, userId: "u2", expiresAt: future, createdAt: created, updatedAt: created });
      await devices.afterSessionCreated({ userId: "u2", ipAddress: `10.0.${i}.5`, userAgent: `UA-${i}` });
    }
    const left = await devices.activeSessions("u2");
    expect(left.map((x) => x.id).sort()).toEqual(["s1", "s2", "s3"]);
    // tā pati ierīce no cita IP tajā pašā /24 tīklā — neskaitās kā jauna
    await devices.afterSessionCreated({ userId: "u2", ipAddress: "10.0.3.99", userAgent: "UA-3" });
    expect((await devices.deviceCounts(["u2"])).get("u2")).toBe(4);
    const detail = await (await import("@/lib/backoffice/service")).getUserDetail("u2");
    expect(detail).toMatchObject({ devices30d: 4, possiblyShared: false });
    await devices.signOutEverywhere("u2");
    expect(await devices.activeSessions("u2")).toHaveLength(0);
  });

  it("Google piesaiste: neapstiprinātam kontam dzēš paroli un apstiprina e-pastu; apstiprinātam — neko nemaina", async () => {
    const devices = await import("@/lib/auth/devices");
    const { eq } = await import("drizzle-orm");
    const now = new Date();
    await db.insert(schema.user).values([
      { id: "g1", name: "G1", email: "g1@example.com", emailVerified: false },
      { id: "g2", name: "G2", email: "g2@example.com", emailVerified: true },
    ]);
    await db.insert(schema.account).values([
      { id: "a1", accountId: "g1", providerId: "credential", userId: "g1", password: "x", createdAt: now, updatedAt: now },
      { id: "a2", accountId: "g2", providerId: "credential", userId: "g2", password: "x", createdAt: now, updatedAt: now },
    ]);
    await devices.afterGoogleLinked("g1");
    await devices.afterGoogleLinked("g2");
    expect(await db.select().from(schema.account).where(eq(schema.account.userId, "g1"))).toHaveLength(0);
    expect((await db.query.user.findFirst({ where: eq(schema.user.id, "g1") }))?.emailVerified).toBe(true);
    expect(await db.select().from(schema.account).where(eq(schema.account.userId, "g2"))).toHaveLength(1);
  });

  it("treniņš: izvēlētās tēmas, limits; “tikai kļūdas” — kļūdainākie vispirms", async () => {
    const training = await import("@/lib/training/service");
    const { eq } = await import("drizzle-orm");
    const [q] = await db.select().from(schema.questions).where(eq(schema.questions.id, 422));
    const sameTopic = (await db.select({ id: schema.questions.id }).from(schema.questions).where(eq(schema.questions.topicId, q.topicId))).map((r) => r.id);
    const other = sameTopic.find((id) => id !== 422)!;
    await db.insert(schema.answers).values([
      { userId: "u1", questionId: other, selectedKey: "a", isCorrect: false, mode: "practice" },
      { userId: "u1", questionId: 422, selectedKey: "a", isCorrect: false, mode: "practice" },
      { userId: "u1", questionId: 422, selectedKey: "b", isCorrect: false, mode: "practice" },
      { userId: "u1", questionId: 422, selectedKey: "c", isCorrect: true, mode: "practice" },
    ]);
    const all = await training.buildTraining("u1", { topicIds: [q.topicId], mistakesOnly: false, limit: 0 });
    expect(all.sort((a, b) => a - b)).toEqual([...sameTopic].sort((a, b) => a - b));
    expect(await training.buildTraining("u1", { topicIds: [q.topicId], mistakesOnly: false, limit: 5 })).toHaveLength(5);
    expect(await training.buildTraining("u1", { topicIds: [q.topicId], mistakesOnly: true, limit: 0 })).toEqual([422, other]);
    expect((await training.getMistakesByTopic("u1")).get(q.topicId)).toBe(2);
    expect(await training.buildTraining("u1", { topicIds: [], mistakesOnly: false, limit: 0 })).toEqual([]);
    expect(training.parseTrainingParams({ temas: "1.1,9.2,x;drop,10.10", kludas: "1", skaits: "20" })).toEqual({
      topicIds: ["1.1", "9.2", "10.10"],
      mistakesOnly: true,
      limit: 20,
    });
    expect(training.parseTrainingParams({ skaits: "999" }).limit).toBe(0);
  });
});
