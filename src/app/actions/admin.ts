"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_VIEW_COOKIE } from "@/lib/billing/access";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { BillingError, grantManualAccess, refundLesson, refundOrder, scheduleLesson, setLessonDone } from "@/lib/billing/service";
import { rigaLocalToDate } from "@/lib/format";
import { signOutEverywhere } from "@/lib/auth/devices";
import { deleteAccount, getUserEmail, saveExplanation } from "@/lib/backoffice/service";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) throw new Error("Nav tiesību");
  return user;
}

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export async function refundOrderAction(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const r = await refundOrder(z.string().min(1).parse(orderId));
    revalidatePath("/admin", "layout");
    const manual = r.order?.provider === "manual";
    if (!r.changed) return { ok: true, message: "Jau bija slēgts." };
    return { ok: true, message: manual ? "Piekļuve atsaukta." : "Atmaksāts. Piekļuve slēgta, pircējam nosūtīts e-pasts." };
  } catch (e) {
    const msg = e instanceof BillingError ? e.message : e instanceof Error ? e.message : "Neizdevās";
    return { ok: false, message: `Atmaksa neizdevās: ${msg}` };
  }
}

const ExplanationForm = z.object({
  id: z.coerce.number().int().positive(),
  explanation: z.string().max(5000).nullable(),
  lawReference: z.string().max(500).nullable(),
  outdatedNote: z.string().max(2000).nullable(),
  status: z.enum(["draft", "reviewed"]),
});

export async function saveExplanationAction(input: z.input<typeof ExplanationForm>): Promise<ActionResult> {
  await requireAdmin();
  const data = ExplanationForm.parse(input);
  const row = await saveExplanation(data.id, data);
  if (!row) return { ok: false, message: "Jautājums nav atrasts" };
  revalidatePath("/admin", "layout");
  revalidatePath(`/jautajums/${data.id}`);
  return { ok: true, message: data.status === "reviewed" ? "Saglabāts un atzīmēts kā pārbaudīts." : "Saglabāts kā melnraksts." };
}

const GrantForm = z.object({
  email: z.string().trim().min(3).max(200),
  name: z.string().trim().max(100).optional(),
  method: z.enum(["cash", "free"]),
  note: z.string().trim().max(300).optional(),
});

export async function grantAccessAction(input: z.input<typeof GrantForm>): Promise<ActionResult & { userId?: string }> {
  await requireAdmin();
  const parsed = GrantForm.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Pārbaudi laukus" };
  try {
    const { order, created } = await grantManualAccess(parsed.data);
    revalidatePath("/admin", "layout");
    return {
      ok: true,
      userId: order.userId,
      message: created
        ? "Konts izveidots un piekļuve atvērta. Uzaicinājums nosūtīts uz e-pastu."
        : "Piekļuve atvērta. Lietotājam nosūtīts e-pasts.",
    };
  } catch (e) {
    return { ok: false, message: e instanceof BillingError ? e.message : "Neizdevās" };
  }
}

export async function signOutEverywhereAction(userId: string): Promise<ActionResult> {
  await requireAdmin();
  await signOutEverywhere(z.string().min(1).parse(userId));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Lietotājs izrakstīts no visām ierīcēm." };
}

/** Praktiskā nodarbība: saglabā laiku (Rīgas laikā, "YYYY-MM-DDTHH:mm"). */
export async function scheduleLessonAction(orderId: string, local: string): Promise<ActionResult> {
  await requireAdmin();
  const at = rigaLocalToDate(String(local));
  if (!at) return { ok: false, message: "Norādi datumu un laiku" };
  try {
    await scheduleLesson(z.string().min(1).parse(orderId), at);
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Saglabāts. Pircējam nosūtīts e-pasts." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Neizdevās" };
  }
}

export async function setLessonDoneAction(orderId: string, done: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    await setLessonDone(z.string().min(1).parse(orderId), Boolean(done));
    revalidatePath("/admin", "layout");
    return { ok: true, message: done ? "Atzīmēts: notikusi." : "Atzīmēts: saskaņota." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Neizdevās" };
  }
}

/** Administratora skats: kā redz lietotājs ar pilnu piekļuvi vai tikai ar bezmaksas moduli. */
export async function setAdminViewAction(view: "pilna" | "bezmaksas"): Promise<void> {
  await requireAdmin();
  (await cookies()).set(ADMIN_VIEW_COOKIE, view === "pilna" ? "pilna" : "bezmaksas", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
}

/** Dzēš vienu kontu. Savu kontu un citu administratoru kontus dzēst nevar. */
export async function deleteAccountAction(userId: string, withInvoices = false): Promise<ActionResult & { invoiced?: number }> {
  const me = await requireAdmin();
  const id = z.string().min(1).parse(userId);
  if (id === me.id) return { ok: false, message: "Savu kontu dzēst nevar." };
  const target = await getUserEmail(id);
  if (target && isAdmin({ email: target.email, emailVerified: true })) return { ok: false, message: "Administratora kontu dzēst nevar." };
  const r = await deleteAccount(id, { withInvoices: Boolean(withInvoices) });
  if (!r.ok) return { ok: false, message: r.reason, invoiced: r.invoiced };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Konts dzēsts." };
}

/** Komplekts: atmaksāt praktiskās nodarbības daļu. */
export async function refundLessonAction(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await refundLesson(z.string().min(1).parse(orderId));
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Nodarbība atmaksāta. Kurss paliek pieejams, pircējam nosūtīts e-pasts." };
  } catch (e) {
    const msg = e instanceof BillingError ? e.message : e instanceof Error ? e.message : "Neizdevās";
    return { ok: false, message: `Atmaksa neizdevās: ${msg}` };
  }
}
