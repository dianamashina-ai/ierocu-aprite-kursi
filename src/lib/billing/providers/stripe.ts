import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { CheckoutInput, CheckoutResult, PaymentEvent, PaymentProvider, RefundInput } from "../types";

/**
 * Stripe Checkout bez SDK (REST API, form-encoded).
 * Vides mainīgie: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
 * Webhook adrese Stripe panelī: <NEXT_PUBLIC_SITE_URL>/api/maksajumi/stripe
 * Notikumi: checkout.session.completed, checkout.session.async_payment_succeeded,
 *           checkout.session.async_payment_failed, checkout.session.expired, charge.refunded
 */
const API = "https://api.stripe.com/v1";

export const stripeProvider: PaymentProvider = {
  name: "stripe",
  async createCheckout(i: CheckoutInput): Promise<CheckoutResult> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY nav iestatīts");
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": i.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(i.amountCents),
      "line_items[0][price_data][product_data][name]": i.product,
      client_reference_id: i.orderId,
      customer_email: i.buyer.email,
      "metadata[order_id]": i.orderId,
      "payment_intent_data[metadata][order_id]": i.orderId,
      locale: "lv",
      success_url: `${i.returnUrl}?order=${encodeURIComponent(i.orderId)}`,
      cancel_url: `${i.cancelUrl}?order=${encodeURIComponent(i.orderId)}`,
    });
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
    if (!res.ok || !json.url || !json.id) throw new Error(`Stripe: ${json.error?.message ?? res.status}`);
    return { redirectUrl: json.url, providerRef: json.id };
  },
  async refund(i: RefundInput) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY nav iestatīts");
    if (!i.providerRef?.startsWith("cs_")) throw new Error("Pasūtījumam nav Stripe sesijas");
    const auth = { Authorization: `Bearer ${key}` };
    const sRes = await fetch(`${API}/checkout/sessions/${encodeURIComponent(i.providerRef)}`, { headers: auth });
    const session = (await sRes.json()) as { payment_intent?: string | null; error?: { message: string } };
    if (!sRes.ok || !session.payment_intent) throw new Error(`Stripe: ${session.error?.message ?? "maksājums nav atrasts"}`);
    const res = await fetch(`${API}/refunds`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": i.idempotencyKey ?? `refund-${i.orderId}` },
      body: new URLSearchParams({ payment_intent: session.payment_intent, amount: String(i.amountCents), "metadata[order_id]": i.orderId }),
    });
    const json = (await res.json()) as { status?: string; error?: { message: string } };
    if (!res.ok || json.status === "failed" || json.status === "canceled") throw new Error(`Stripe: ${json.error?.message ?? json.status ?? res.status}`);
  },
};

/** Stripe-Signature: "t=…,v1=…" — HMAC-SHA256(secret, `${t}.${rawBody}`), pieļaujamā nobīde 5 min. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=", 2) as [string, string]));
  const t = Number(parts.t);
  const sigs = header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(nowSec - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest();
  return sigs.some((s) => {
    const b = Buffer.from(s, "hex");
    return b.length === expected.length && timingSafeEqual(b, expected);
  });
}

type StripeEvent = { type: string; data: { object: Record<string, unknown> } };

/** Stripe notikums → mūsu PaymentEvent (vai null, ja notikums nav par mūsu pasūtījumu). */
export function stripeEventToPayment(event: StripeEvent): PaymentEvent | null {
  const o = event.data.object;
  const meta = (o.metadata ?? {}) as Record<string, string>;
  const orderId = meta.order_id ?? (o.client_reference_id as string | undefined);
  if (!orderId) return null;
  switch (event.type) {
    case "checkout.session.completed":
      return { orderId, providerRef: o.id as string, status: o.payment_status === "paid" ? "paid" : "pending" };
    case "checkout.session.async_payment_succeeded":
      return { orderId, providerRef: o.id as string, status: "paid" };
    case "checkout.session.async_payment_failed":
      return { orderId, providerRef: o.id as string, status: "failed" };
    case "checkout.session.expired":
      return { orderId, providerRef: o.id as string, status: "canceled" };
    case "charge.refunded":
      // tikai pilna atmaksa atņem piekļuvi
      return o.refunded === true ? { orderId, status: "refunded" } : null;
    default:
      return null;
  }
}

/** Atgriežoties no Stripe — pārbauda sesijas statusu tieši (lai nebūtu jāgaida webhook). */
export async function fetchStripeSessionStatus(sessionId: string): Promise<"paid" | "pending" | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !sessionId.startsWith("cs_")) return null;
  const res = await fetch(`${API}/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) return null;
  const s = (await res.json()) as { payment_status?: string };
  return s.payment_status === "paid" ? "paid" : "pending";
}
