import type { OrderBuyer } from "@/db/schema";

export type ProviderName = "stripe" | "montonio" | "dev" | "manual";

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

export interface RefundInput {
  orderId: string;
  providerRef: string | null;
  amountCents: number;
}

export interface PaymentProvider {
  name: ProviderName;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Pilna atmaksa maksājumu sistēmā. Kļūdas gadījumā met izņēmumu. */
  refund(input: RefundInput): Promise<void>;
}
