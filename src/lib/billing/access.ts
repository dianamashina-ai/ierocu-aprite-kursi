import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { FREE_MODULE_IDS } from "@/config/exam";
import { COURSE_ACCESS_CODES } from "@/config/pricing";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";

/** Administratora skata pārslēgs (sīkdatne): “pilna” vai “bezmaksas” piekļuve — tikai savam kontam. */
export const ADMIN_VIEW_COOKIE = "admin_skats";

async function adminPreview(userId: string): Promise<boolean | null> {
  try {
    const v = (await cookies()).get(ADMIN_VIEW_COOKIE)?.value;
    if (v !== "pilna" && v !== "bezmaksas") return null;
    const u = await getCurrentUser();
    if (!u || u.id !== userId || !isAdmin(u)) return null;
    return v === "pilna";
  } catch {
    return null; // ārpus pieprasījuma (piem., testos) — bez pārslēga
  }
}

/** Apmaksāts pasūtījums, kas atver kursu (kurss, komplekts vai testa pirkums; ne tikai praktiskā nodarbība). */
export const courseAccessWhere = (userId: string) =>
  and(eq(schema.orders.userId, userId), eq(schema.orders.status, "paid"), inArray(schema.orders.productCode, COURSE_ACCESS_CODES));

export const isFreeModule = (moduleId: string) => (FREE_MODULE_IDS as readonly string[]).includes(moduleId);
export const moduleOfTopic = (topicId: string) => `M${topicId.split(".")[0]}`;

/** Vai lietotājam ir apmaksāta pilna piekļuve (kešots viena pieprasījuma ietvaros). */
export const hasFullAccess = cache(async (userId: string | null | undefined): Promise<boolean> => {
  if (!userId) return false;
  const preview = await adminPreview(userId);
  if (preview !== null) return preview;
  const row = await db.query.orders.findFirst({
    columns: { id: true },
    where: courseAccessWhere(userId),
  });
  return Boolean(row);
});

/** Bezmaksas modulis — tikai reģistrētiem; pārējie — ar pilnu piekļuvi. */
export async function canAccessModule(userId: string | null | undefined, moduleId: string) {
  return (isFreeModule(moduleId) && Boolean(userId)) || (await hasFullAccess(userId));
}

/** Viesis bezmaksas moduļa lapā → uz reģistrāciju (pēc tam atpakaļ uz to pašu lapu). */
export function requireSignUpForFreeModule(userId: string | null | undefined, moduleId: string, path: string) {
  if (!userId && isFreeModule(moduleId)) redirect(`/registreties?next=${encodeURIComponent(path)}`);
}

export async function canAccessQuestion(userId: string | null | undefined, questionId: number) {
  const q = await db.query.questions.findFirst({ columns: { topicId: true }, where: eq(schema.questions.id, questionId) });
  return q ? canAccessModule(userId, moduleOfTopic(q.topicId)) : false;
}
