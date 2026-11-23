"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { buyPath, isProductCode, productByCode, type ProductCode } from "@/config/pricing";
import { activeProviderName, applyPaymentEvent, BillingError, getOrderForUser, startCheckout } from "@/lib/billing/service";

export type CheckoutState = { error?: string; fields?: Record<string, string> };

const BuyerForm = z.object({
  name: z.string().trim().min(2, "Ievadi vārdu un uzvārdu").max(120),
  terms: z.literal("on", { message: "Lai turpinātu, jāpiekrīt lietošanas noteikumiem" }),
});
const Waiver = z.literal("on", { message: "Lai turpinātu, jāapstiprina piekrišana" });
/** Tālrunis: cipari, atstarpes, +, -, (); vismaz 8 cipari. */
const Phone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => /^[+\d\s()-]+$/.test(v) && v.replace(/\D/g, "").length >= 8, "Ievadi tālruni, piem., +371 20000000");

/** Pieprasījuma adrese (atgriešanās un paziņojumu saitēm); produkcijā — BETTER_AUTH_URL. */
async function requestOrigin() {
  if (process.env.NODE_ENV === "production" && process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? "http"}://${host}`;
}

export async function checkoutAction(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const code: ProductCode = isProductCode(form.get("product")) ? (form.get("product") as ProductCode) : "course";
  const product = productByCode(code);
  const user = await getCurrentUser();
  if (!user) redirect(`/pieslegties?next=${encodeURIComponent(buyPath(code))}`);
  const raw = Object.fromEntries(["name", "phone", "waiver", "terms"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = BuyerForm.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: raw };
  let phone: string | undefined;
  if (product.includesLesson) {
    const p = Phone.safeParse(raw.phone);
    if (!p.success) return { error: p.error.issues[0].message, fields: raw };
    phone = p.data;
  }
  if (product.includesCourse) {
    const w = Waiver.safeParse(raw.waiver);
    if (!w.success) return { error: w.error.issues[0].message, fields: raw };
  }
  const method = form.get("method") === "card" ? "card" : "bank";

  let url: string;
  try {
    url = await startCheckout(user.id, { name: parsed.data.name, email: user.email, ...(phone ? { phone } : {}) }, await requestOrigin(), code, method);
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
