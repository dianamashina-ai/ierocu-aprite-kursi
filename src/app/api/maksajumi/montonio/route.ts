import { NextResponse } from "next/server";
import { applyPaymentEvent } from "@/lib/billing/service";
import { montonioTokenToPayment } from "@/lib/billing/providers/montonio";

export const dynamic = "force-dynamic";

/** Montonio paziņojums: { orderToken: "<JWT>" }, parakstīts ar MONTONIO_SECRET_KEY. */
export async function POST(req: Request) {
  if (!process.env.MONTONIO_SECRET_KEY) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { orderToken?: string } | null;
  const ev = body?.orderToken ? montonioTokenToPayment(body.orderToken) : null;
  if (!ev) return NextResponse.json({ error: "bad token" }, { status: 400 });
  await applyPaymentEvent(ev, "montonio");
  return NextResponse.json({ received: true });
}
