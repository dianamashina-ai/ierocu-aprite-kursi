/** Dienas atslēga Rīgas laikā (YYYY-MM-DD). */
export function rigaDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function prevDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d - 1));
  return t.toISOString().slice(0, 10);
}

/**
 * Pašreizējā sērija: secīgas dienas ar vismaz vienu atbildi, kas beidzas šodien vai vakar
 * (vakardienas sērija vēl nav pārtrūkusi, ja šodien vēl nav mācīts).
 */
export function currentStreak(activeDays: Iterable<string>, today: string): number {
  const set = new Set(activeDays);
  let day = set.has(today) ? today : prevDay(today);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = prevDay(day);
  }
  return n;
}
