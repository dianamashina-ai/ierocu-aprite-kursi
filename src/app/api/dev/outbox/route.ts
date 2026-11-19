import { NextResponse } from "next/server";
import { devOutbox } from "@/lib/email/send";

/** Izstrādes pastkastīte: e-pasti, kas "nosūtīti" bez RESEND_API_KEY. Produkcijā izslēgta. */
export function GET() {
  const enabled = process.env.NODE_ENV !== "production" || process.env.DEV_OUTBOX === "1";
  if (!enabled || process.env.RESEND_API_KEY) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(devOutbox());
}
