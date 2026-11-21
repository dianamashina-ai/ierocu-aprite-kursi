/** Paroles prasības — kopīgas pārlūkam (saraksts zem lauka) un serverim (better-auth āķis). */
export const PASSWORD_RULES = [
  { id: "len", label: "8 rakstzīmes", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "1 lielais burts", test: (p: string) => /\p{Lu}/u.test(p) },
  { id: "digit", label: "1 cipars", test: (p: string) => /\d/.test(p) },
  { id: "symbol", label: "1 simbols (piem., ! ? # -)", test: (p: string) => /[^\p{L}\d\s]/u.test(p) },
] as const;

export const isStrongPassword = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

export const WEAK_PASSWORD_MESSAGE = "Parolei jābūt vismaz 8 rakstzīmes garai, ar lielo burtu, ciparu un simbolu.";
