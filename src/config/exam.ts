/**
 * Noklusējuma iestatījumi. Datubāzē (app_settings) tos var pārrakstīt administrācijā.
 * Avots: MK noteikumi Nr. 191 (content/law/mk-191-kvalifikacijas-parbaudijums.md), 18. un 19. punkts —
 * 40 jautājumi, 40 minūtes, nokārtots, ja ne vairāk par 4 nepareizām vai neatbildētām atbildēm (= 90 %).
 */
export const DEFAULT_EXAM_CONFIG = {
  questionCount: 40,
  durationMinutes: 40,
  passPercent: 90,
} as const;

export type ExamConfig = { questionCount: number; durationMinutes: number; passPercent: number };

export const DEFAULT_CONTENT_VERSION = "VP 2026-03";

/** Bezmaksas modulis (pārējie pēc apmaksas, 5. posms). */
export const FREE_MODULE_IDS = ["M1"] as const;
