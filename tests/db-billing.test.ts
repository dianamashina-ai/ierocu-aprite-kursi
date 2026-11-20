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
});
