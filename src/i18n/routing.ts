import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["lv", "ru"],
  defaultLocale: "lv",
  // Latviešu valoda bez prefiksa (/), krievu — /ru/...
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
