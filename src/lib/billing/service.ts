import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderBuyer } from "@/db/schema";
import { COURSE_PRODUCT, LESSON_SCHEDULING, productByCode, splitVat, type ProductCode } from "@/config/pricing";
import { courseAccessWhere } from "./access";
import { sendEmail } from "@/lib/email/send";
import { formatEuro, formatLessonAt } from "@/lib/format";
import { activeProviderName, invoiceNumber } from "./config";

export { activeProviderName, invoiceNumber };
import type { PaymentEvent, PaymentProvider, PayMethod, ProviderName } from "./types";
import { stripeProvider } from "./providers/stripe";
import { montonioPaymentMethods, montonioProvider } from "./providers/montonio";
import { devProvider } from "./providers/dev";
import { manualProvider } from "./providers/manual";

export class BillingError extends Error {}

/** Vietnes adrese e-pastiem (izpildes laikā, ne būvēšanas laikā). */
const siteUrl = () =>
  (
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

const providers: Record<ProviderName, PaymentProvider> = { stripe: stripeProvider, montonio: montonioProvider, dev: devProvider, manual: manualProvider };

export async function createOrder(userId: string, buyer: OrderBuyer, opts: { provider?: ProviderName; now?: Date; product?: ProductCode } = {}) {
  const product = productByCode(opts.product ?? "course");
  const provider = opts.provider ?? activeProviderName();
  if (!provider) throw new BillingError("Maksājumi pašlaik nav pieejami. Lūdzu, mēģini vēlāk.");
  if (product.includesLesson && !buyer.phone) throw new BillingError("Norādi tālruni — administrators sazināsies, lai saskaņotu nodarbības laiku.");
  // Kursu otrreiz nepārdodam; praktisko nodarbību (un testa pirkumu) var pirkt arī ar esošu piekļuvi.
  if (product.code === "course" || product.code === "bundle") {
    const paid = await db.query.orders.findFirst({ columns: { id: true }, where: courseAccessWhere(userId) });
    if (paid)
      throw new BillingError(
        product.code === "bundle"
          ? "Tev jau ir pilna piekļuve kursam — praktisko nodarbību vari iegādāties atsevišķi."
          : "Tev jau ir pilna piekļuve kursam.",
      );
  }

  const { netCents, vatCents } = splitVat(product.amountCents, product.vatRate);
  const [order] = await db
    .insert(schema.orders)
    .values({
      id: randomUUID(),
      userId,
      provider,
      product: product.name,
      productCode: product.code,
      amountCents: product.amountCents,
      netCents,
      vatCents,
      vatRate: product.vatRate,
      currency: product.currency,
      buyer,
      waiverAcceptedAt: product.includesCourse ? (opts.now ?? new Date()) : null,
      createdAt: opts.now ?? new Date(),
    })
    .returning();
  return order;
}

/** Izveido pasūtījumu un maksājumu sesiju; atgriež adresi, uz kuru novirzīt pircēju. */
export async function startCheckout(
  userId: string,
  buyer: OrderBuyer,
  origin = siteUrl(),
  product: ProductCode = "course",
  method: PayMethod = "bank",
) {
  const order = await createOrder(userId, buyer, { product });
  const site = origin.replace(/\/$/, "");
  const { redirectUrl, providerRef } = await providers[order.provider].createCheckout({
    orderId: order.id,
    method,
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

/** Maksāšanas veidi, ko rādīt pirkuma lapā. */
export async function availablePayMethods(): Promise<PayMethod[]> {
  const p = activeProviderName();
  if (p === "montonio") return montonioPaymentMethods();
  if (p === "dev") return ["bank", "card"]; // testa režīmā — lai var pārbaudīt izvēli
  return ["bank"];
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
    // drošība: summa, valūta un maksājuma sistēmas pasūtījuma id jāsakrīt ar mūsu pasūtījumu
    const mismatch =
      (ev.amountCents !== undefined && ev.amountCents !== order.amountCents) ||
      (ev.currency !== undefined && ev.currency !== order.currency) ||
      (ev.providerRef && order.providerRef && ev.providerRef !== order.providerRef);
    if (mismatch) {
      console.error("Maksājuma paziņojums nesakrīt ar pasūtījumu", { orderId: order.id, provider });
      return { changed: false, becamePaid: false, order };
    }
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
  const product = productByCode((order.productCode as ProductCode) ?? "course");
  const link = `${siteUrl()}/rekins/${order.id}`;
  const lines = [
    `Sveiki, ${order.buyer.name}!`,
    "",
    `Maksājums ${formatEuro(order.amountCents)} saņemts: ${product.title}.`,
    product.includesCourse ? "Tagad tev ir pieejami visi kursa moduļi, nodarbības un izmēģinājuma eksāmens." : "",
    product.includesLesson ? LESSON_SCHEDULING : "",
    "",
    `Rēķins ${order.invoiceNumber}: ${link}`,
    product.includesCourse ? `Sākt mācīties: ${siteUrl()}/` : "",
  ].filter((l, i, arr) => l !== "" || (i > 0 && arr[i - 1] !== ""));
  await sendEmail({
    to: order.buyer.email,
    subject: `Paldies par pirkumu — ${product.title}, rēķins ${order.invoiceNumber}`,
    text: lines.join("\n") + "\n",
  });
  if (product.includesLesson) await notifyAdminsLesson(order, product.title).catch((e) => console.error("Admin e-pasts:", e));
}

/** Administratoriem: jauns praktiskās nodarbības pirkums — jāsazinās ar pircēju. */
async function notifyAdminsLesson(order: typeof schema.orders.$inferSelect, title: string) {
  const to = (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().replace(/^["'<]+|["'>]+$/g, ""))
    .filter(Boolean);
  for (const addr of to)
    await sendEmail({
      to: addr,
    subject: `Jauns pieteikums praktiskajai nodarbībai — ${order.buyer.name}`,
    text:
      `${title}, ${formatEuro(order.amountCents)} (rēķins ${order.invoiceNumber}).\n\n` +
      `Vārds: ${order.buyer.name}\nE-pasts: ${order.buyer.email}\nTālrunis: ${order.buyer.phone ?? "—"}\n\n` +
      `Sazinies, lai saskaņotu nodarbības datumu un laiku.\n${siteUrl()}/admin/pasutijumi\n`,
    });
}

export async function getOrderForUser(orderId: string, userId: string) {
  return (
    (await db.query.orders.findFirst({ where: and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)) })) ?? null
  );
}

export async function getOrderById(orderId: string) {
  return (await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) })) ?? null;
}

export async function getOrdersForUser(userId: string) {
  return db.select().from(schema.orders).where(eq(schema.orders.userId, userId)).orderBy(desc(schema.orders.createdAt));
}

/**
 * Pilna atmaksa (administratoram): vispirms maksājumu sistēmā, tad pasūtījums → refunded (piekļuve tiek slēgta).
 * Ja maksājumu sistēma atmaksu noraida, datubāzē nekas nemainās.
 */
export async function refundOrder(orderId: string, opts: { now?: Date } = {}) {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!order) throw new BillingError("Pasūtījums nav atrasts");
  if (order.status !== "paid") throw new BillingError("Atmaksāt var tikai apmaksātu pasūtījumu");
  await providers[order.provider].refund({ orderId: order.id, providerRef: order.providerRef, amountCents: order.amountCents });
  const result = await applyPaymentEvent({ orderId: order.id, status: "refunded" }, order.provider, opts);
  if (result.changed && result.order && result.order.provider !== "manual") {
    await sendEmail({
      to: result.order.buyer.email,
      subject: `Atmaksa veikta — rēķins ${result.order.invoiceNumber}`,
      text:
        `Sveiki, ${result.order.buyer.name}!\n\n` +
        `Esam atmaksājuši ${formatEuro(result.order.amountCents)} par rēķinu ${result.order.invoiceNumber}. ` +
        `Nauda atgriezīsies tajā pašā maksāšanas veidā dažu darba dienu laikā.` +
        (productByCode(result.order.productCode as ProductCode)?.includesCourse ? " Pilna piekļuve kursam ir slēgta, 1. modulis paliek pieejams." : "") +
        "\n",
    }).catch((e) => console.error("Atmaksas e-pasts:", e));
  }
  return result;
}

/** Apmaksāts pasūtījums ar praktisko nodarbību (administratora darbībām). */
async function paidLessonOrder(orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!order || order.status !== "paid") throw new BillingError("Apmaksāts pasūtījums nav atrasts");
  if (!productByCode(order.productCode as ProductCode)?.includesLesson) throw new BillingError("Šajā pasūtījumā nav praktiskās nodarbības");
  return order;
}

/** Administrators saskaņo (vai pārceļ) nodarbības laiku; pircējam nosūta apstiprinājumu. */
export async function scheduleLesson(orderId: string, at: Date) {
  const order = await paidLessonOrder(orderId);
  const moved = order.lessonStatus === "scheduled" && order.lessonAt && order.lessonAt.getTime() !== at.getTime();
  const [updated] = await db
    .update(schema.orders)
    .set({ lessonStatus: "scheduled", lessonAt: at })
    .where(eq(schema.orders.id, orderId))
    .returning();
  if (order.lessonAt?.getTime() !== at.getTime() || order.lessonStatus !== "scheduled") {
    await sendEmail({
      to: order.buyer.email,
      subject: moved ? `Praktiskā nodarbība pārcelta — ${formatLessonAt(at)}` : `Praktiskā nodarbība saskaņota — ${formatLessonAt(at)}`,
      text:
        `Sveiki, ${order.buyer.name}!\n\n` +
        `${moved ? "Tava praktiskā nodarbība pārcelta uz" : "Tava praktiskā nodarbība ieplānota"}: ${formatLessonAt(at)}.\n\n` +
        `Nodarbība notiek mūsu šautuvē ar sertificētu instruktoru. Ja laiks jāmaina, atbildi uz šo e-pastu.\n`,
    }).catch((e) => console.error("Nodarbības e-pasts:", e));
  }
  return updated;
}

/** Atzīmē nodarbību kā notikušu (done) vai atgriež saskaņotu (scheduled). */
export async function setLessonDone(orderId: string, done: boolean) {
  const order = await paidLessonOrder(orderId);
  if (done && !order.lessonAt) throw new BillingError("Vispirms norādi nodarbības laiku");
  const [updated] = await db
    .update(schema.orders)
    .set({ lessonStatus: done ? "done" : order.lessonAt ? "scheduled" : null })
    .where(eq(schema.orders.id, orderId))
    .returning();
  return updated;
}

export const INVITE_TOKEN_DAYS = 3;

/** Paroles iestatīšanas žetons uzaicinājumam (tāds pats formāts kā better-auth paroles atjaunošanai, tikai ilgāks). */
async function createInviteToken(userId: string, now: Date) {
  const token = randomBytes(18).toString("base64url");
  await db.insert(schema.verification).values({
    id: randomUUID(),
    identifier: `reset-password:${token}`,
    value: userId,
    expiresAt: new Date(now.getTime() + INVITE_TOKEN_DAYS * 24 * 3600 * 1000),
    createdAt: now,
    updatedAt: now,
  });
  return token;
}

export type ManualMethod = "cash" | "free";
export const MANUAL_METHOD_LABEL: Record<ManualMethod, string> = { cash: "Skaidra nauda", free: "Bez maksas" };

/**
 * Administrators piešķir pilnu piekļuvi (samaksāts skaidrā naudā vai bez maksas). Rēķins netiek izrakstīts.
 * Ja konta nav — tas tiek izveidots (bez paroles), un uz e-pastu nosūtīts uzaicinājums pieslēgties.
 */
export async function grantManualAccess(
  input: { email: string; name?: string | null; method: ManualMethod; note?: string | null },
  opts: { now?: Date } = {},
) {
  const now = opts.now ?? new Date();
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BillingError("Pārbaudi e-pasta adresi");
  let account = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  let created = false;
  if (!account) {
    [account] = await db
      .insert(schema.user)
      .values({ id: randomUUID(), email, name: input.name?.trim() || email.split("@")[0], createdAt: now, updatedAt: now })
      .returning();
    created = true;
  }
  const paid = await db.query.orders.findFirst({ columns: { id: true }, where: courseAccessWhere(account.id) });
  if (paid) throw new BillingError("Šim lietotājam jau ir pilna piekļuve");

  const amount = input.method === "cash" ? COURSE_PRODUCT.amountCents : 0;
  const { netCents, vatCents } = splitVat(amount, COURSE_PRODUCT.vatRate);
  const note = [MANUAL_METHOD_LABEL[input.method], input.note?.trim()].filter(Boolean).join(": ");
  const [order] = await db
    .insert(schema.orders)
    .values({
      id: randomUUID(),
      userId: account.id,
      provider: "manual",
      status: "paid",
      product: COURSE_PRODUCT.name,
      productCode: COURSE_PRODUCT.code,
      amountCents: amount,
      netCents,
      vatCents,
      vatRate: COURSE_PRODUCT.vatRate,
      currency: COURSE_PRODUCT.currency,
      buyer: { name: input.name?.trim() || account.name, email },
      waiverAcceptedAt: now,
      createdAt: now,
      paidAt: now,
      note,
    })
    .returning();

  const login = `${siteUrl()}/pieslegties?epasts=${encodeURIComponent(email)}`;
  // jaunam kontam — saite paroles iestatīšanai (derīga INVITE_TOKEN_DAYS dienas)
  const setPassword = created ? `${siteUrl()}/parole/jauna?token=${await createInviteToken(account.id, now)}&epasts=${encodeURIComponent(email)}` : null;
  await sendEmail({
    to: email,
    subject: "Tev atvērta pilna piekļuve kursam “Ieroču atļauja”",
    text:
      `Sveiki!\n\nTev ir atvērta pilna piekļuve mācību kursam sagatavošanās ieroču atļaujas kvalifikācijas pārbaudījumam: ` +
      `visi moduļi, nodarbības, skaidrojumi un izmēģinājuma eksāmens.\n\n` +
      (setPassword
        ? `Konts jau ir izveidots ar šo e-pasta adresi. Iestati paroli un sāc mācīties (saite derīga ${INVITE_TOKEN_DAYS} dienas):\n${setPassword}\n\n` +
          `Ja tev ir Google konts ar šo pašu e-pastu, vari arī vienkārši pieslēgties ar «Turpināt ar Google»: ${login}\n`
        : `Pieslēdzies ar savu kontu:\n${login}\n`),
  }).catch((e) => console.error("Piekļuves e-pasts:", e));
  return { order, created };
}
