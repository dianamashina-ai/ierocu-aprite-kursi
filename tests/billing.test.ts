import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { splitVat, COURSE_PRODUCT } from "@/config/pricing";
import { stripeEventToPayment, verifyStripeSignature } from "@/lib/billing/providers/stripe";
import { montonioTokenToPayment, signJwt, verifyJwt } from "@/lib/billing/providers/montonio";
import { activeProviderName, invoiceNumber } from "@/lib/billing/config";

describe("cena un PVN", () => {
  it("120 € ar PVN 21 % = 99,17 € + 20,83 €", () => {
    expect(splitVat(COURSE_PRODUCT.amountCents, COURSE_PRODUCT.vatRate)).toEqual({ netCents: 9917, vatCents: 2083 });
  });
  it("summa vienmēr sakrīt", () => {
    for (const g of [1, 99, 12000, 12345]) {
      const { netCents, vatCents } = splitVat(g, 21);
      expect(netCents + vatCents).toBe(g);
    }
  });
  it("rēķina numurs pēc Rīgas laika gada", () => {
    expect(invoiceNumber(7, new Date("2026-11-19T10:00:00Z"))).toBe("IE-2026-00007");
    expect(invoiceNumber(8, new Date("2026-12-31T22:30:00Z"))).toBe("IE-2027-00008"); // Rīgā jau 1. janvāris
  });
});

describe("maksājumu sistēmas izvēle", () => {
  it("izstrādē bez iestatījumiem — testa maksājums", () => {
    expect(activeProviderName({ NODE_ENV: "development" })).toBe("dev");
  });
  it("produkcijā bez iestatījumiem — pirkšana izslēgta", () => {
    expect(activeProviderName({ NODE_ENV: "production" })).toBeNull();
    expect(activeProviderName({ NODE_ENV: "production", PAYMENT_PROVIDER: "dev" })).toBeNull();
    expect(activeProviderName({ NODE_ENV: "production", PAYMENT_PROVIDER: "dev", ALLOW_TEST_PAYMENTS: "1" })).toBe("dev");
  });
  it("stripe un montonio", () => {
    expect(activeProviderName({ NODE_ENV: "production", PAYMENT_PROVIDER: "stripe" })).toBe("stripe");
    expect(activeProviderName({ NODE_ENV: "production", PAYMENT_PROVIDER: "montonio" })).toBe("montonio");
  });
});

describe("Stripe webhook", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ type: "checkout.session.completed" });
  const sign = (t: number, b = body, s = secret) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${b}`).digest("hex")}`;

  it("pareizs paraksts tiek pieņemts", () => {
    expect(verifyStripeSignature(body, sign(1000), secret, 1000)).toBe(true);
  });
  it("viltots, novecojis vai trūkstošs paraksts — noraidīts", () => {
    expect(verifyStripeSignature(body, sign(1000, body, "cits"), secret, 1000)).toBe(false);
    expect(verifyStripeSignature(body + " ", sign(1000), secret, 1000)).toBe(false);
    expect(verifyStripeSignature(body, sign(1000), secret, 1000 + 301)).toBe(false);
    expect(verifyStripeSignature(body, null, secret)).toBe(false);
  });
  it("notikumi → statuss", () => {
    const ev = (type: string, o: Record<string, unknown>) => stripeEventToPayment({ type, data: { object: o } });
    expect(ev("checkout.session.completed", { id: "cs_1", payment_status: "paid", metadata: { order_id: "o1" } })).toEqual({
      orderId: "o1",
      providerRef: "cs_1",
      status: "paid",
    });
    expect(ev("checkout.session.completed", { id: "cs_1", payment_status: "unpaid", client_reference_id: "o1" })?.status).toBe("pending");
    expect(ev("charge.refunded", { refunded: true, metadata: { order_id: "o1" } })?.status).toBe("refunded");
    expect(ev("charge.refunded", { refunded: false, metadata: { order_id: "o1" } })).toBeNull();
    expect(ev("payment_intent.created", { metadata: { order_id: "o1" } })).toBeNull();
    expect(ev("checkout.session.completed", { id: "cs_x" })).toBeNull();
  });
});

describe("Montonio JWT", () => {
  const secret = "montonio-secret";
  it("parakstīts token tiek pārbaudīts; viltots — noraidīts", () => {
    const tok = signJwt({ merchantReference: "o1", paymentStatus: "PAID", uuid: "u1" }, secret);
    expect(verifyJwt(tok, secret)).toMatchObject({ merchantReference: "o1" });
    expect(verifyJwt(tok, "cits")).toBeNull();
    const [h, , s] = tok.split(".");
    const forged = `${h}.${Buffer.from(JSON.stringify({ merchantReference: "o1", paymentStatus: "PAID" })).toString("base64url")}.${s}`;
    expect(verifyJwt(forged, secret)).toBeNull();
  });
  it("beidzies exp — noraidīts", () => {
    expect(verifyJwt(signJwt({ exp: 100 }, secret), secret, 200)).toBeNull();
  });
  it("statusu kartēšana", () => {
    const st = (s: string) => montonioTokenToPayment(signJwt({ merchantReference: "o1", paymentStatus: s }, secret), secret)?.status;
    expect(st("PAID")).toBe("paid");
    expect(st("ABANDONED")).toBe("canceled");
    expect(st("REFUNDED")).toBe("refunded");
    expect(st("PENDING")).toBe("pending");
  });
  it("summa un valūta no token", () => {
    const ev = montonioTokenToPayment(signJwt({ merchantReference: "o1", paymentStatus: "PAID", grandTotal: 120, currency: "EUR", uuid: "u1" }, secret), secret);
    expect(ev).toMatchObject({ orderId: "o1", providerRef: "u1", status: "paid", amountCents: 12000, currency: "EUR" });
  });
});
