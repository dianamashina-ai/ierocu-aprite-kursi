import type { OrderBuyer } from "@/db/schema";

export type ProviderName = "stripe" | "montonio" | "dev" | "manual";

/** Maksāšanas veids, ko pircējs izvēlas mūsu lapā: internetbanka vai karte (t. sk. Apple Pay / Google Pay). */
export type PayMethod = "bank" | "card";
export const PAY_METHODS: readonly PayMethod[] = ["bank", "card"];

export interface CheckoutInput {
  method?: PayMethod;
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
  /** samaksātā summa centos (ja maksājumu sistēma to paziņo) — jāsakrīt ar pasūtījumu */
  amountCents?: number;
  currency?: string;
}

export interface RefundInput {
  orderId: string;
  providerRef: string | null;
  amountCents: number;
  /** Atkārtotas atmaksas aizsardzībai; noklusējumā — viena pilna atmaksa pasūtījumam */
  idempotencyKey?: string;
}

export interface PaymentProvider {
  name: ProviderName;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Pilna atmaksa maksājumu sistēmā. Kļūdas gadījumā met izņēmumu. */
  refund(input: RefundInput): Promise<void>;
}
