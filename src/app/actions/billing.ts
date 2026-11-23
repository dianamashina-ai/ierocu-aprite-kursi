"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { activeProviderName, applyPaymentEvent, BillingError, getOrderForUser, startCheckout } from "@/lib/billing/service";

export type CheckoutState = { error?: string; fields?: Record<string, string> };

const BuyerForm = z.object({
  name: z.string().trim().min(2, "Ievadi vārdu un uzvārdu").max(120),
  waiver: z.literal("on", { message: "Lai turpinātu, jāapstiprina piekrišana" }),
  terms: z.literal("on", { message: "Lai turpinātu, jāpiekrīt lietošanas noteikumiem" }),
});

/** Pieprasījuma adrese (atgriešanās un paziņojumu saitēm); produkcijā — BETTER_AUTH_URL. */
async function requestOrigin() {
  if (process.env.NODE_ENV === "production" && process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? "http"}://${host}`;
}

export async function checkoutAction(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/pieslegties?next=${encodeURIComponent(form.get("product") === "test" ? "/iegadaties?produkts=test" : "/iegadaties")}`);
  const raw = Object.fromEntries(["name", "waiver", "terms"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = BuyerForm.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: raw };
  const { name } = parsed.data;
  // PAGAIDU: testa produkts (1,50 €) maksājumu pārbaudei.
  const product = form.get("product") === "test" ? "test" : "full-course";
  const method = form.get("method") === "card" ? "card" : "bank";

  let url: string;
  try {
    url = await startCheckout(user.id, { name, email: user.email }, await requestOrigin(), product, method);
  } catch (e) {
    if (e instanceof BillingError) return { error: e.message, fields: raw };
    console.error(e);
    return { error: "Neizdevās sākt maksājumu. Lūdzu, mēģini vēlreiz.", fields: raw };
  }
  redirect(url);
}

/** Testa maksājums — tikai, ja aktīvs "dev" un pasūtījums pieder lietotājam. */
export async function testPaymentAction(orderId: string, outcome: "paid" | "canceled") {
  const user = await getCurrentUser();
  if (!user) redirect("/pieslegties");
  if (activeProviderName() !== "dev") throw new Error("Testa maksājumi nav ieslēgti");
  const order = await getOrderForUser(orderId, user.id);
  if (!order || order.provider !== "dev") throw new Error("Pasūtījums nav atrasts");
  await applyPaymentEvent({ orderId, status: outcome }, "dev");
  redirect(outcome === "paid" ? `/maksajums/rezultats?order=${orderId}` : "/iegadaties");
}
