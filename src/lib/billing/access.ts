import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { FREE_MODULE_IDS } from "@/config/exam";

export const isFreeModule = (moduleId: string) => (FREE_MODULE_IDS as readonly string[]).includes(moduleId);
export const moduleOfTopic = (topicId: string) => `M${topicId.split(".")[0]}`;

/** Vai lietotājam ir apmaksāta pilna piekļuve (kešots viena pieprasījuma ietvaros). */
export const hasFullAccess = cache(async (userId: string | null | undefined): Promise<boolean> => {
  if (!userId) return false;
  const row = await db.query.orders.findFirst({
    columns: { id: true },
    where: and(eq(schema.orders.userId, userId), eq(schema.orders.status, "paid")),
  });
  return Boolean(row);
});

export async function canAccessModule(userId: string | null | undefined, moduleId: string) {
  return isFreeModule(moduleId) || (await hasFullAccess(userId));
}

export async function canAccessQuestion(userId: string | null | undefined, questionId: number) {
  const q = await db.query.questions.findFirst({ columns: { topicId: true }, where: eq(schema.questions.id, questionId) });
  return q ? canAccessModule(userId, moduleOfTopic(q.topicId)) : false;
}
