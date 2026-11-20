import "server-only";
import type { PaymentProvider } from "../types";

/** Administratora piešķirta piekļuve: maksājumu sistēmas nav, atsaukšana notiek tikai datubāzē. */
export const manualProvider: PaymentProvider = {
  name: "manual",
  async createCheckout() {
    throw new Error("Manuālai piekļuvei nav apmaksas lapas");
  },
  async refund() {},
};
