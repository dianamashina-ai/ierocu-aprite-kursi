import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderBuyer } from "@/db/schema";
import { COURSE_PRODUCT, splitVat } from "@/config/pricing";
import { sendEmail } from "@/lib/email/send";
import { formatEuro } from "@/lib/format";
import { activeProviderName, invoiceNumber } from "./config";

export { activeProviderName, invoiceNumber };
import type { PaymentEvent, PaymentProvider, ProviderName } from "./types";
import { stripeProvider } from "./providers/stripe";
import { montonioProvider } from "./providers/montonio";
import { devProvider } from "./providers/dev";

export class BillingError extends Error {}

/** Vietnes adrese e-pastiem (izpildes laikā, ne būvēšanas laikā). */
const siteUrl = () => (process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const providers: Record<ProviderName, PaymentProvider> = { stripe: stripeProvider, montonio: montonioProvider, dev: devProvider };

export async function createOrder(userId: string, buyer: OrderBuyer, opts: { provider?: ProviderName; now?: Date } = {}) {
  const provider = opts.provider ?? activeProviderName();
  if (!provider) throw new BillingError("Maksājumi pašlaik nav pieejami. Lūdzu, mēģini vēlāk.");
  const paid = await db.query.orders.findFirst({
    columns: { id: true },
    where: and(eq(schema.orders.userId, userId), eq(schema.orders.status, "paid")),
  });
  if (paid) throw new BillingError("Tev jau ir pilna piekļuve kursam.");

  const { netCents, vatCents } = splitVat(COURSE_PRODUCT.amountCents, COURSE_PRODUCT.vatRate);
  const [order] = await db
    .insert(schema.orders)
    .values({
      id: randomUUID(),
      userId,
      provider,
      product: COURSE_PRODUCT.name,
      amountCents: COURSE_PRODUCT.amountCents,
      netCents,
      vatCents,
      vatRate: COURSE_PRODUCT.vatRate,
      currency: COURSE_PRODUCT.currency,
      buyer,
      waiverAcceptedAt: opts.now ?? new Date(),
      createdAt: opts.now ?? new Date(),
    })
    .returning();
  return order;
}

/** Izveido pasūtījumu un maksājumu sesiju; atgriež adresi, uz kuru novirzīt pircēju. */
export async function startCheckout(userId: string, buyer: OrderBuyer, origin = siteUrl()) {
  const order = await createOrder(userId, buyer);
  const site = origin.replace(/\/$/, "");
  const { redirectUrl, providerRef } = await providers[order.provider].createCheckout({
    orderId: order.id,
    product: order.product,
    amountCents: order.amountCents,
    currency: order.currency,
    buyer,
    returnUrl: `${site}/maksajums/rezultats`,
    cancelUrl: `${site}/iegadaties`,
    notificationUrl: `${site}/api/maksajumi/${order.provider}`,
  });
  await db.update(schema.orders).set({ providerRef }).where(eq(schema.orders.id, order.id));
  return redirectUrl;
}

/**
 * Piemēro maksājumu sistēmas paziņojumu (idempotenti — paziņojumi var atkārtoties).
 * Rēķina numuru piešķir tikai pirmajā pārejā uz "paid".
 */
export async function applyPaymentEvent(ev: PaymentEvent, provider: ProviderName, opts: { now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, ev.orderId)).for("update");
    if (!order || order.provider !== provider) return { changed: false, becamePaid: false, order: null };
    const set: Partial<typeof schema.orders.$inferInsert> = {};
    if (ev.status === "paid" && order.status !== "paid" && order.status !== "refunded") {
      const [{ seq }] = await tx.execute<{ seq: string }>(sql`select nextval('invoice_seq') as seq`);
      Object.assign(set, { status: "paid", paidAt: now, invoiceNumber: invoiceNumber(Number(seq), now) });
    } else if (ev.status === "refunded" && order.status === "paid") {
      Object.assign(set, { status: "refunded", refundedAt: now });
    } else if ((ev.status === "failed" || ev.status === "canceled") && order.status === "pending") {
      set.status = ev.status;
    }
    if (ev.providerRef && !order.providerRef) set.providerRef = ev.providerRef;
    if (!Object.keys(set).length) return { changed: false, becamePaid: false, order };
    const [updated] = await tx.update(schema.orders).set(set).where(eq(schema.orders.id, order.id)).returning();
    return { changed: true, becamePaid: set.status === "paid", order: updated };
  });
  if (result.becamePaid && result.order) await sendReceipt(result.order).catch((e) => console.error("Rēķina e-pasts:", e));
  return result;
}

async function sendReceipt(order: typeof schema.orders.$inferSelect) {
  const link = `${siteUrl()}/rekins/${order.id}`;
  await sendEmail({
    to: order.buyer.email,
    subject: `Paldies! Pilna piekļuve kursam atvērta — rēķins ${order.invoiceNumber}`,
    text:
      `Sveiki, ${order.buyer.name}!\n\n` +
      `Maksājums ${formatEuro(order.amountCents)} saņemts — tagad tev ir pieejami visi kursa moduļi, nodarbības un izmēģinājuma eksāmens.\n\n` +
      `Rēķins ${order.invoiceNumber}: ${link}\n` +
      `Sākt mācīties: ${siteUrl()}/panelis\n`,
  });
}

export async function getOrderForUser(orderId: string, userId: string) {
  return (
    (await db.query.orders.findFirst({ where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)) })) ?? null
  );
}

export async function getOrdersForUser(userId: string) {
  return db.select().from(schema.orders).where(eq(schema.orders.userId, userId)).orderBy(desc(schema.orders.createdAt));
}
