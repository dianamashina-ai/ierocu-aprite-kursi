const dt = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const d = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", weekday: "long", day: "numeric", month: "long" });
export const formatDateTime = (x: Date) => dt.format(x);
export const formatDay = (isoDay: string) => d.format(new Date(`${isoDay}T12:00:00Z`));
export const plural = (n: number, one: string, many: string, zero = many) =>
  `${n} ${n % 10 === 1 && n % 100 !== 11 ? one : n === 0 ? zero : many}`;

const eur = new Intl.NumberFormat("lv-LV", { style: "currency", currency: "EUR" });
/** 12000 → "120,00 €" */
export const formatEuro = (cents: number) => eur.format(cents / 100);
const dateOnly = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", day: "2-digit", month: "2-digit", year: "numeric" });
/** → "19.11.2026." */
export const formatDate = (x: Date) => `${dateOnly.format(x).replace(/\.$/, "")}.`;
export const rigaYear = (x: Date) => Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Riga", year: "numeric" }).format(x));

/** Rīgas laika "YYYY-MM-DDTHH:mm" (datetime-local) → Date. Ņem vērā vasaras/ziemas laiku. */
export function rigaLocalToDate(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (t: number) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en", { timeZone: "Europe/Riga", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .formatToParts(new Date(t))
        .map((x) => [x.type, x.value]),
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
  };
  const t = guess - offsetAt(guess);
  return new Date(guess - offsetAt(t));
}

/** Date → Rīgas laika "YYYY-MM-DDTHH:mm" (datetime-local laukam). */
export function dateToRigaLocal(x: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en", { timeZone: "Europe/Riga", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(x)
      .map((v) => [v.type, v.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

const lessonFmt = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
/** → "piektdiena, 12. decembris 10:00" */
export const formatLessonAt = (x: Date) => lessonFmt.format(x);
