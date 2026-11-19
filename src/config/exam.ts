/**
 * Noklusējuma iestatījumi. Datubāzē (app_settings) tos var pārrakstīt administrācijā.
 * Reālo eksāmena formātu precizēs īpašnieks — šīs ir pagaidu vērtības.
 */
export const DEFAULT_EXAM_CONFIG = {
  questionCount: 30,
  durationMinutes: 60,
  passPercent: 90,
} as const;

export type ExamConfig = { questionCount: number; durationMinutes: number; passPercent: number };

export const DEFAULT_CONTENT_VERSION = "VP 2026-03";

/** Bezmaksas modulis (pārējie pēc apmaksas, 5. posms). */
export const FREE_MODULE_IDS = ["M1"] as const;
