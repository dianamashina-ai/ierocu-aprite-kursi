import { NextResponse } from "next/server";
import { applyPaymentEvent } from "@/lib/billing/service";
import { stripeEventToPayment, verifyStripeSignature } from "@/lib/billing/providers/stripe";

export const dynamic = "force-dynamic";

/** Stripe webhook. Paraksts tiek pārbaudīts ar STRIPE_WEBHOOK_SECRET. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  const ev = stripeEventToPayment(JSON.parse(raw));
  if (ev) await applyPaymentEvent(ev, "stripe");
  return NextResponse.json({ received: true });
}
