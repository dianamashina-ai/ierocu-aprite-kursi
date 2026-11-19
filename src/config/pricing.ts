/**
 * Cena: viens vienreizējs maksājums par pilnu kursu (bez termiņa).
 * Cena norādīta AR PVN; neto un PVN summas aprēķina splitVat().
 */
export const COURSE_PRODUCT = {
  code: "full-course",
  name: "Ieroču aprites kvalifikācijas pārbaudījuma sagatavošanas kurss — pilna piekļuve",
  amountCents: 12000,
  vatRate: 21,
  currency: "EUR",
} as const;

/** Bruto summa (ar PVN) → { net, vat } centos; noapaļo neto, PVN = starpība, lai summa sakristu. */
export function splitVat(grossCents: number, vatRate: number) {
  const net = Math.round((grossCents * 100) / (100 + vatRate));
  return { netCents: net, vatCents: grossCents - net };
}
