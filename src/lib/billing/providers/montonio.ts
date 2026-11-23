import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { CheckoutInput, CheckoutResult, PaymentEvent, PaymentProvider, PayMethod } from "../types";

/**
 * Montonio (Stargate API v2) — bankas maksājumi (paymentInitiation) un kartes (cardPayments; tajā arī Apple Pay / Google Pay).
 * Vides mainīgie: MONTONIO_ACCESS_KEY, MONTONIO_SECRET_KEY, MONTONIO_SANDBOX=1 (testa vide).
 * Pieprasījumi un paziņojumi ir JWT (HS256), parakstīti ar slepeno atslēgu.
 * Pirms produkcijas pārbaudīt Montonio sandbox vidē (lauku nosaukumi pēc API v2 dokumentācijas).
 */
const base = () =>
  process.env.MONTONIO_SANDBOX === "1" ? "https://sandbox-stargate.montonio.com/api" : "https://stargate.montonio.com/api";

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signJwt(payload: Record<string, unknown>, secret: string) {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", secret).update(`${head}.${body}`).digest());
  return `${head}.${body}.${sig}`;
}

/** Pārbauda HS256 parakstu un exp; atgriež payload vai null. */
export function verifyJwt<T = Record<string, unknown>>(token: string, secret: string, nowSec = Math.floor(Date.now() / 1000)): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head, body, sig] = parts;
  try {
    if (JSON.parse(Buffer.from(head, "base64url").toString()).alg !== "HS256") return null;
    const expected = createHmac("sha256", secret).update(`${head}.${body}`).digest();
    const given = Buffer.from(sig, "base64url");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof payload.exp === "number" && payload.exp < nowSec) return null;
    return payload as T;
  } catch {
    return null;
  }
}

function keys() {
  const accessKey = process.env.MONTONIO_ACCESS_KEY;
  const secret = process.env.MONTONIO_SECRET_KEY;
  if (!accessKey || !secret) throw new Error("MONTONIO_ACCESS_KEY / MONTONIO_SECRET_KEY nav iestatīti");
  return { accessKey, secret };
}

export const montonioProvider: PaymentProvider = {
  name: "montonio",
  async createCheckout(i: CheckoutInput): Promise<CheckoutResult> {
    const { accessKey, secret } = keys();
    const amount = i.amountCents / 100;
    const [firstName, ...rest] = i.buyer.name.trim().split(/\s+/);
    const payload = {
      accessKey,
      merchantReference: i.orderId,
      returnUrl: `${i.returnUrl}?order=${encodeURIComponent(i.orderId)}`,
      notificationUrl: i.notificationUrl,
      currency: i.currency,
      grandTotal: amount,
      locale: "lv",
      billingAddress: { firstName, lastName: rest.join(" ") || firstName, email: i.buyer.email },
      lineItems: [{ name: i.product, quantity: 1, finalPrice: amount }],
      payment:
        i.method === "card"
          ? { method: "cardPayments", amount, currency: i.currency }
          : {
              method: "paymentInitiation",
              amount,
              currency: i.currency,
              methodOptions: { preferredCountry: "LV", preferredLocale: "lv", paymentDescription: `Ieroču atļauja — pilna piekļuve (${i.orderId.slice(0, 8)})` },
            },
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
    };
    const res = await fetch(`${base()}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: signJwt(payload, secret) }),
    });
    const json = (await res.json()) as { paymentUrl?: string; uuid?: string; message?: string };
    if (!res.ok || !json.paymentUrl) throw new Error(`Montonio: ${json.message ?? res.status}`);
    return { redirectUrl: json.paymentUrl, providerRef: json.uuid ?? "" };
  },
  /** Montonio Stargate: POST /refunds { data: JWT{ accessKey, orderUuid, amount, idempotencyKey, iat, exp } }. Bankas maksājumiem jāieslēdz atmaksas Partner System. */
  async refund(i) {
    const { accessKey, secret } = keys();
    if (!i.providerRef) throw new Error("Pasūtījumam nav Montonio identifikatora");
    const payload = {
      accessKey,
      orderUuid: i.providerRef,
      amount: i.amountCents / 100,
      idempotencyKey: `refund-${i.orderId}`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
    };
    const res = await fetch(`${base()}/refunds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: signJwt(payload, secret) }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      const msg = String(json.message ?? res.status);
      if (/cannot be refunded/i.test(msg)) {
        throw new Error(
          "Montonio pagaidām nevar atmaksāt šo maksājumu. Bankas maksājumu var atmaksāt apmēram 1 darba dienu pēc apmaksas, kad nauda nonākusi Montonio. Pārbaudi arī, vai Montonio Partner System ieslēgtas bankas maksājumu atmaksas (Bank payment refunds).",
        );
      }
      throw new Error(`Montonio: ${msg}`);
    }
  },
};

const METHOD_KEYS: Record<PayMethod, string> = { bank: "paymentInitiation", card: "cardPayments" };
let methodsCache: { at: number; methods: PayMethod[] } | null = null;

/** Montonio atbilde (GET /stores/payment-methods) → mūsu maksāšanas veidi, kas veikalam ieslēgti. */
export function enabledFromResponse(paymentMethods: unknown): PayMethod[] {
  const names = new Set<string>();
  if (Array.isArray(paymentMethods)) {
    for (const m of paymentMethods) if (m && typeof m === "object") names.add(String((m as { code?: string; name?: string }).code ?? (m as { name?: string }).name));
  } else if (paymentMethods && typeof paymentMethods === "object") {
    for (const k of Object.keys(paymentMethods)) names.add(k);
  }
  return (Object.keys(METHOD_KEYS) as PayMethod[]).filter((m) => names.has(METHOD_KEYS[m]));
}

/** Veikalam ieslēgtie maksāšanas veidi (kešots 10 min). Ja Montonio neatbild — abi, lai pirkšana nebūtu bloķēta. */
export async function montonioPaymentMethods(): Promise<PayMethod[]> {
  if (methodsCache && Date.now() - methodsCache.at < 10 * 60_000) return methodsCache.methods;
  try {
    const { accessKey, secret } = keys();
    const now = Math.floor(Date.now() / 1000);
    const res = await fetch(`${base()}/stores/payment-methods`, {
      headers: { Authorization: `Bearer ${signJwt({ accessKey, iat: now, exp: now + 600 }, secret)}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Montonio payment-methods: ${res.status}`);
    const json = (await res.json()) as { paymentMethods?: unknown };
    const methods = enabledFromResponse(json.paymentMethods);
    if (!methods.length) throw new Error("Montonio payment-methods: tukšs saraksts");
    methodsCache = { at: Date.now(), methods };
    return methods;
  } catch (e) {
    console.error(e);
    return ["bank", "card"];
  }
}

type MontonioToken = { uuid?: string; merchantReference?: string; paymentStatus?: string; accessKey?: string; grandTotal?: number; currency?: string };

/** Montonio orderToken (paziņojumā vai return URL "order-token") → PaymentEvent. */
export function montonioTokenToPayment(token: string, secret = process.env.MONTONIO_SECRET_KEY ?? ""): PaymentEvent | null {
  const p = verifyJwt<MontonioToken>(token, secret);
  if (!p?.merchantReference) return null;
  if (process.env.MONTONIO_ACCESS_KEY && p.accessKey && p.accessKey !== process.env.MONTONIO_ACCESS_KEY) return null;
  const map: Record<string, PaymentEvent["status"]> = {
    PAID: "paid",
    PENDING: "pending",
    AUTHORIZED: "pending",
    ABANDONED: "canceled",
    VOIDED: "canceled",
    REFUNDED: "refunded",
  };
  return {
    orderId: p.merchantReference,
    providerRef: p.uuid,
    status: map[p.paymentStatus ?? ""] ?? "pending",
    amountCents: typeof p.grandTotal === "number" ? Math.round(p.grandTotal * 100) : undefined,
    currency: p.currency,
  };
}
