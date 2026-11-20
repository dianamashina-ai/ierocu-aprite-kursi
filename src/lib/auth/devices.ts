import "server-only";
import { and, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";

/** Cik ierīcēs vienlaikus drīkst būt pieslēgts viens konts. */
export const MAX_DEVICES = 3;
/** Pieslēgšanās vēstures glabāšanas termiņš. */
export const LOGIN_HISTORY_DAYS = 90;
/** Tik daudz dažādu ierīču 30 dienās — iespējama konta koplietošana. */
export const SHARING_DEVICE_THRESHOLD = 6;

/**
 * Pēc jaunas sesijas: ieraksta vēsturē un atstāj tikai MAX_DEVICES jaunākās aktīvās sesijas
 * (vecākās ierīces tiek izrakstītas). Kļūda šeit nedrīkst traucēt pieslēgties.
 */
export async function afterSessionCreated(s: { userId: string; ipAddress?: string | null; userAgent?: string | null }, now = new Date()) {
  try {
    await db.insert(schema.loginEvents).values({ userId: s.userId, ipAddress: s.ipAddress ?? null, userAgent: s.userAgent ?? null, createdAt: now });
    const active = await db
      .select({ id: schema.session.id })
      .from(schema.session)
      .where(and(eq(schema.session.userId, s.userId), gt(schema.session.expiresAt, now)))
      .orderBy(desc(schema.session.createdAt));
    const extra = active.slice(MAX_DEVICES).map((r) => r.id);
    if (extra.length) await db.delete(schema.session).where(inArray(schema.session.id, extra));
    // veco vēsturi notīra laiku pa laikam (nevis katrā pieslēgšanās reizē)
    if (Math.random() < 0.05) {
      const cutoff = new Date(now.getTime() - LOGIN_HISTORY_DAYS * 24 * 3600 * 1000);
      await db.delete(schema.loginEvents).where(lt(schema.loginEvents.createdAt, cutoff));
    }
  } catch (e) {
    console.error("Sesiju ierobežojums:", e);
  }
}

/** Ierīces pazīme: pārlūks + IP tīkls (IPv4 /24), lai mājas IP maiņa neskaitītos kā jauna ierīce. */
const deviceKey = sql<string>`coalesce(${schema.loginEvents.userAgent}, '') || '|' || coalesce(regexp_replace(${schema.loginEvents.ipAddress}, '\\.\\d+$', ''), '')`;

/** Dažādu ierīču skaits pēdējās 30 dienās katram lietotājam. */
export async function deviceCounts(userIds: string[], now = new Date()) {
  if (!userIds.length) return new Map<string, number>();
  const since = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const rows = await db
    .select({ userId: schema.loginEvents.userId, n: sql<number>`count(distinct ${deviceKey})::int` })
    .from(schema.loginEvents)
    .where(and(inArray(schema.loginEvents.userId, userIds), gt(schema.loginEvents.createdAt, since)))
    .groupBy(schema.loginEvents.userId);
  return new Map(rows.map((r) => [r.userId, Number(r.n)]));
}

export async function recentLogins(userId: string, limit = 30) {
  return db
    .select()
    .from(schema.loginEvents)
    .where(eq(schema.loginEvents.userId, userId))
    .orderBy(desc(schema.loginEvents.createdAt))
    .limit(limit);
}

export async function activeSessions(userId: string, now = new Date()) {
  return db
    .select({ id: schema.session.id, createdAt: schema.session.createdAt, userAgent: schema.session.userAgent, ipAddress: schema.session.ipAddress })
    .from(schema.session)
    .where(and(eq(schema.session.userId, userId), gt(schema.session.expiresAt, now)))
    .orderBy(desc(schema.session.createdAt));
}

/** Izraksta lietotāju no visām ierīcēm. */
export async function signOutEverywhere(userId: string) {
  await db.delete(schema.session).where(eq(schema.session.userId, userId));
}
