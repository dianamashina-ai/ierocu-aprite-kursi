const dt = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const d = new Intl.DateTimeFormat("lv-LV", { timeZone: "Europe/Riga", weekday: "long", day: "numeric", month: "long" });
export const formatDateTime = (x: Date) => dt.format(x);
export const formatDay = (isoDay: string) => d.format(new Date(`${isoDay}T12:00:00Z`));
export const plural = (n: number, one: string, many: string, zero = many) =>
  `${n} ${n % 10 === 1 && n % 100 !== 11 ? one : n === 0 ? zero : many}`;
