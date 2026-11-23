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

/**
 * Testa produkts maksājumu pārbaudei ar īstu naudu (pieejams tikai administratoriem /iegadaties lapā).
 * Dod tādu pašu pilnu piekļuvi kā kurss — lai var pārbaudīt visu ceļu: apmaksa → piekļuve → rēķins → atmaksa.
 */
export const TEST_PRODUCT = {
  code: "test",
  name: "Ieroču aprites kvalifikācijas pārbaudījuma sagatavošanas kurss — testa pirkums",
  amountCents: 150,
  vatRate: 21,
  currency: "EUR",
} as const;

export type ProductCode = typeof COURSE_PRODUCT.code | typeof TEST_PRODUCT.code;
export const productByCode = (code: ProductCode) => (code === TEST_PRODUCT.code ? TEST_PRODUCT : COURSE_PRODUCT);

/** Bruto summa (ar PVN) → { net, vat } centos; noapaļo neto, PVN = starpība, lai summa sakristu. */
export function splitVat(grossCents: number, vatRate: number) {
  const net = Math.round((grossCents * 100) / (100 + vatRate));
  return { netCents: net, vatCents: grossCents - net };
}
