import { getRequestConfig } from "next-intl/server";

/**
 * Platforma ir tikai latviešu valodā. next-intl izmantojam teksta katalogam
 * (messages/lv.json) un pareizām daudzskaitļa formām, bez valodu maršrutēšanas.
 */
export const LOCALE = "lv";

export default getRequestConfig(async () => ({
  locale: LOCALE,
  messages: (await import("../../messages/lv.json")).default,
  timeZone: "Europe/Riga",
}));
