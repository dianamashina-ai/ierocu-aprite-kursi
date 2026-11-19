import { rigaYear } from "@/lib/format";
import type { ProviderName } from "./types";

/**
 * Aktīvā maksājumu sistēma: PAYMENT_PROVIDER=stripe|montonio|dev.
 * Testa maksājumi produkcijā ir aizliegti, ja vien nav ALLOW_TEST_PAYMENTS=1 (priekšskatījums, e2e).
 * null → pirkšana nav pieejama.
 */
export function activeProviderName(env = process.env): ProviderName | null {
  const p = env.PAYMENT_PROVIDER;
  if (p === "stripe" || p === "montonio") return p;
  const testAllowed = env.NODE_ENV !== "production" || env.ALLOW_TEST_PAYMENTS === "1";
  if ((p === "dev" || !p) && testAllowed) return "dev";
  return null;
}

export function invoiceNumber(seq: number, date: Date) {
  return `IE-${rigaYear(date)}-${String(seq).padStart(5, "0")}`;
}

