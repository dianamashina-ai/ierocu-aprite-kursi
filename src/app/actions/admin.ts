"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/admin";
import { BillingError, refundOrder } from "@/lib/billing/service";
import { saveExplanation } from "@/lib/backoffice/service";

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
    return { ok: true, message: r.changed ? "Atmaksāts. Piekļuve slēgta, pircējam nosūtīts e-pasts." : "Pasūtījums jau bija atmaksāts." };
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
