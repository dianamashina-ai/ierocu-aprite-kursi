/** Cik pēc kārtas jāatbild, lai jautājums kļūtu apgūts / vairs nebūtu apgūts. */
export const MASTERY_STREAK = 2;

export interface MasteryState {
  mastered: boolean;
  /** >0 — pareizas atbildes pēc kārtas, <0 — nepareizas pēc kārtas */
  streak: number;
}

/**
 * Jautājums kļūst apgūts pēc 2 pareizām atbildēm pēc kārtas
 * un vairs nav apgūts tikai pēc 2 nepareizām pēc kārtas — viena kļūda progresu nesamazina.
 */
export function nextMastery(prev: MasteryState | null, isCorrect: boolean): MasteryState {
  const p = prev ?? { mastered: false, streak: 0 };
  const streak = isCorrect ? Math.max(p.streak, 0) + 1 : Math.min(p.streak, 0) - 1;
  let mastered = p.mastered;
  if (!mastered && streak >= MASTERY_STREAK) mastered = true;
  if (mastered && streak <= -MASTERY_STREAK) mastered = false;
  return { mastered, streak };
}
