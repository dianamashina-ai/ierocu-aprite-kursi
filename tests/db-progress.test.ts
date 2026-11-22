/**
 * Integrācijas tests: atbilžu saglabāšana, atkārtošana, panelis un izmēģinājuma eksāmens
 * reālā PostgreSQL (TEST_DATABASE_URL). Datubāze tiek notīrīta!
 */
import "dotenv/config";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url; // @/db lasa DATABASE_URL importa brīdī

describe.skipIf(!url)("progress un eksāmens (DB)", async () => {
  const { db, schema } = await import("@/db");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { loadContent } = await import("@/lib/content/source");
  const { seedDatabase } = await import("@/lib/content/seed");
  const svc = await import("@/lib/progress/service");
  const content = loadContent();
  const byId = new Map(content.questions.map((q) => [q.id, q]));
  const wrongKey = (id: number) => byId.get(id)!.options.find((o) => o.key !== byId.get(id)!.correctKey)!.key;
  const DAY = 86_400_000;
  const t0 = new Date("2026-11-19T10:00:00Z");
  const U = "user-test-1";

  beforeAll(async () => {
    await db.execute(sql`drop schema if exists public cascade; create schema public; drop schema if exists drizzle cascade;`);
    await migrate(db, { migrationsFolder: "drizzle" });
    await seedDatabase(db, content);
    await db.insert(schema.user).values({ id: U, name: "Tests", email: "tests@example.com" });
  });

  it("serveris pats nosaka pareizību; nederīgs variants tiek noraidīts", async () => {
    const q = byId.get(243)!;
    expect(await svc.recordAnswer(U, 243, "d", "practice", { now: t0 })).toEqual({ isCorrect: true, correctKey: q.correctKey });
    await expect(svc.recordAnswer(U, 468, "e", "practice", { now: t0 })).rejects.toThrow(/Nederīgs/);
  });

  it("kļūda atgriežas pēc 1, 3, 7 dienām", async () => {
    await svc.recordAnswer(U, 1, wrongKey(1), "practice", { now: t0 });
    expect(await svc.getDueReviewIds(U, t0)).not.toContain(1);
    expect(await svc.getDueReviewIds(U, new Date(t0.getTime() + DAY))).toContain(1);
    await svc.recordAnswer(U, 1, byId.get(1)!.correctKey, "review", { now: new Date(t0.getTime() + DAY) });
    expect(await svc.getDueReviewIds(U, new Date(t0.getTime() + 3 * DAY))).not.toContain(1);
    expect(await svc.getDueReviewIds(U, new Date(t0.getTime() + 4 * DAY))).toContain(1);
    expect(await svc.getWrongIds(U)).not.toContain(1);
  });

  it("panelis: procenti, neatbildētie, sērija", async () => {
    const d = await svc.getDashboard(U, t0);
    expect(d.totalQuestions).toBe(515);
    expect(d.answeredQuestions).toBe(2);
    expect(d.unanswered).toBe(513);
    expect(d.streak).toBe(1);
    const t31 = d.modules.flatMap((m) => m.topics).find((t) => t.id === "3.1")!;
    expect(t31.mastered).toBe(0); // Q1: nepareizi, tad pareizi — vēl nav 2 pareizas pēc kārtas
    expect(d.mistakes).toBe(0); // pēdējā atbilde pareiza — kļūdu sarakstā nav
    expect(d.readiness.ready).toBe(false);
  });

  it("izmēģinājuma eksāmens: sākt, atbildēt, pabeigt, rezultāts progresā", async () => {
    const id = await svc.startExam(U, t0);
    expect(await svc.startExam(U, new Date(t0.getTime() + 60_000))).toBe(id); // turpina to pašu
    const a = (await svc.getExamAttempt(U, id, t0))!;
    expect(a.questionIds).toHaveLength(40);
    expect(new Set(a.questionIds).size).toBe(40);
    // 36 pareizi, 1 nepareizi, 3 neatbildēti → 4 kļūdas = 90 % → nokārtots (MK Nr. 191, 19. p.)
    for (const [i, qid] of a.questionIds.entries()) {
      if (i < 36) await svc.saveExamAnswer(U, id, qid, byId.get(qid)!.correctKey, t0);
      else if (i === 36) await svc.saveExamAnswer(U, id, qid, wrongKey(qid), t0);
    }
    await expect(svc.saveExamAnswer(U, id, 999, "a", t0)).rejects.toThrow();
    const done = await svc.finishExam(U, id, new Date(t0.getTime() + 10 * 60_000));
    expect(done.correctCount).toBe(36);
    expect(done.passed).toBe(true);
    expect((await svc.finishExam(U, id)).correctCount).toBe(36); // idempotenti
    await expect(svc.saveExamAnswer(U, id, a.questionIds[39], "a", t0)).rejects.toThrow(/pabeigts/);
    const hist = await svc.getExamHistory(U);
    expect(hist[0].id).toBe(id);
  });

  it("nokavēts eksāmens tiek pabeigts automātiski pēc laika", async () => {
    const id = await svc.startExam(U, t0);
    const late = new Date(t0.getTime() + 42 * 60_000);
    const a = await svc.getExamAttempt(U, id, late);
    expect(a?.status).toBe("finished");
    expect(a?.correctCount).toBe(0);
    expect(a?.passed).toBe(false);
    expect(a?.finishedAt?.getTime()).toBe(t0.getTime() + 40 * 60_000);
  });

  it("cits lietotājs neredz svešu eksāmenu", async () => {
    const id = await svc.startExam(U, new Date(t0.getTime() + 2 * DAY));
    expect(await svc.getExamAttempt("cits", id)).toBeNull();
    vi.useRealTimers();
  });

  it("eksāmeni skaitās tikai pēc 70 % sasniegšanas; gatavība — 5 pēc kārtas pēc tam", async () => {
    const V = "user-unlock";
    await db.insert(schema.user).values({ id: V, name: "V", email: "v@example.com" });
    const ex = (i: number, at: Date, passed: boolean) => ({
      id: `ex-${V}-${i}`, userId: V, status: "finished" as const, questionIds: [1], seed: "s", durationMinutes: 40, passPercent: 90,
      startedAt: at, finishedAt: at, correctCount: passed ? 40 : 0, passed,
    });
    // agrs “paskatīšanās” eksāmens
    await db.insert(schema.examAttempts).values(ex(0, new Date(t0.getTime() - DAY), false));
    let d = await svc.getDashboard(V, t0);
    expect(d.examsUnlocked).toBe(false);
    expect(d.exams).toHaveLength(0);

    // 361 no 515 apgūti (70 %) → nākamā atbilde piefiksē brīdi
    const ids = [...byId.keys()].filter((id) => id !== 2).slice(0, 361);
    await db.insert(schema.questionProgress).values(
      ids.map((questionId) => ({ userId: V, questionId, attempts: 2, correctCount: 2, lastCorrect: true, mastered: true, streak: 2, lastAnsweredAt: t0 })),
    );
    await svc.recordAnswer(V, 2, wrongKey(2), "practice", { now: t0 });
    d = await svc.getDashboard(V, t0);
    expect(d.examsUnlocked).toBe(true);
    expect(d.exams).toHaveLength(0); // agrais eksāmens neskaitās

    for (let i = 1; i <= 5; i++) await db.insert(schema.examAttempts).values(ex(i, new Date(t0.getTime() + i * 60_000), true));
    d = await svc.getDashboard(V, new Date(t0.getTime() + DAY));
    expect(d.exams).toHaveLength(5);
    expect(d.readiness.examsPassed).toBe(5);
  });
});
