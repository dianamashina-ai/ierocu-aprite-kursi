/**
 * Integrācijas tests: migrācijas + sēklošana reālā PostgreSQL (TEST_DATABASE_URL).
 * Testu datubāze tiek pilnībā notīrīta! Ja TEST_DATABASE_URL nav — tests tiek izlaists.
 */
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { loadContent } from "@/lib/content/source";
import { seedDatabase } from "@/lib/content/seed";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("datubāzes sēklošana", () => {
  const client = postgres(url!, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });
  const content = loadContent();

  beforeAll(async () => {
    await db.execute(sql`drop schema if exists public cascade; create schema public;`);
    await db.execute(sql`drop schema if exists drizzle cascade;`);
    await migrate(db, { migrationsFolder: "drizzle" });
    await seedDatabase(db, content);
  });
  afterAll(() => client.end());

  const count = async (table: string) =>
    Number((await db.execute(sql.raw(`select count(*)::int as n from ${table}`)))[0].n);

  it("ielādēti visi ieraksti", async () => {
    expect(await count("official_sections")).toBe(10);
    expect(await count("modules")).toBe(9);
    expect(await count("topics")).toBe(37);
    expect(await count("questions")).toBe(515);
    expect(await count("question_options")).toBe(content.questions.reduce((s, q) => s + q.options.length, 0));
  });

  it("katram jautājumam tieši viena pareizā atbilde starp variantiem", async () => {
    const rows = await db.execute(sql`
      select q.id, count(o.key)::int as n from questions q
      left join question_options o on o.question_id = q.id and o.key = q.correct_key
      group by q.id having count(o.key) <> 1`);
    expect(rows).toHaveLength(0);
  });

  it("tēmu summa = 515 un katrs jautājums vienā tēmā", async () => {
    const rows = await db.execute(sql`select sum(n)::int as total from (
      select count(*) as n from questions group by topic_id) t`);
    expect(rows[0].total).toBe(515);
  });

  it("noklusējuma iestatījumi", async () => {
    const exam = await db.query.appSettings.findFirst({ where: eq(schema.appSettings.key, "exam") });
    expect(exam?.value).toEqual({ questionCount: 30, durationMinutes: 60, passPercent: 90 });
  });

  it("atkārtota sēklošana nemaina administrācijas labojumus; --reset atjauno tekstu, bet saglabā skaidrojumu", async () => {
    await db
      .update(schema.questions)
      .set({ text: "ADMIN LABOTS", explanationLv: "skaidrojums", explanationStatus: "reviewed" })
      .where(eq(schema.questions.id, 1));

    expect(await seedDatabase(db, content)).toEqual({ inserted: 0, updated: 0 });
    let q1 = await db.query.questions.findFirst({ where: eq(schema.questions.id, 1) });
    expect(q1?.text).toBe("ADMIN LABOTS");

    const r = await seedDatabase(db, content, { reset: true });
    expect(r.updated).toBe(515);
    q1 = await db.query.questions.findFirst({ where: eq(schema.questions.id, 1) });
    expect(q1?.text).toBe(content.questions.find((q) => q.id === 1)!.text);
    expect(q1?.explanationLv).toBe("skaidrojums");
    expect(q1?.explanationStatus).toBe("reviewed");
    expect(await count("question_options")).toBe(content.questions.reduce((s, q) => s + q.options.length, 0));
  });
});
