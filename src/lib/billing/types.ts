import type { OrderBuyer } from "@/db/schema";

export type ProviderName = "stripe" | "montonio" | "dev";

export interface CheckoutInput {
  orderId: string;
  product: string;
  amountCents: number;
  currency: string;
  buyer: OrderBuyer;
  /** Kur atgriezt pircēju pēc maksājuma (bez parametriem) */
  returnUrl: string;
  cancelUrl: string;
  notificationUrl: string;
}

export interface CheckoutResult {
  redirectUrl: string;
  providerRef: string;
}

/** Ko maksājumu sistēma paziņo par pasūtījumu (pēc paraksta pārbaudes). */
export interface PaymentEvent {
  orderId: string;
  providerRef?: string;
  status: "paid" | "failed" | "canceled" | "refunded" | "pending";
}

export interface PaymentProvider {
  name: ProviderName;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}
