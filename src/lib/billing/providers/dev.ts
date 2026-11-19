import "server-only";
import type { CheckoutInput, CheckoutResult, PaymentProvider } from "../types";

/** Testa maksājums (izstrāde, priekšskatījums, e2e testi) — īstas naudas nav. */
export const devProvider: PaymentProvider = {
  name: "dev",
  async createCheckout(i: CheckoutInput): Promise<CheckoutResult> {
    const site = new URL(i.returnUrl).origin;
    return { redirectUrl: `${site}/maksajums/tests?order=${encodeURIComponent(i.orderId)}`, providerRef: `dev_${i.orderId}` };
  },
};
