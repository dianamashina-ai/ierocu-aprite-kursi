/**
 * Produkti: mācību kurss (tiešsaistē), praktiskā nodarbība šautuvē un abi kopā.
 * Cenas norādītas AR PVN; neto un PVN summas aprēķina splitVat().
 */
type Product = {
  code: ProductCode;
  /** Pilns nosaukums — rēķinā un pasūtījumā */
  name: string;
  /** Īss nosaukums — saskarnē */
  title: string;
  amountCents: number;
  vatRate: number;
  currency: "EUR";
  /** Atver pilnu piekļuvi tiešsaistes kursam */
  includesCourse: boolean;
  /** Ietver praktisko nodarbību šautuvē (datumu saskaņo administrators) */
  includesLesson: boolean;
};

export type ProductCode = "course" | "lesson" | "bundle" | "test";

export const COURSE_PRODUCT = {
  code: "course",
  name: "Ieroču aprites kvalifikācijas pārbaudījuma sagatavošanas kurss — pilna piekļuve",
  title: "Mācību kurss",
  amountCents: 12000,
  vatRate: 21,
  currency: "EUR",
  includesCourse: true,
  includesLesson: false,
} as const satisfies Product;

export const LESSON_PRODUCT = {
  code: "lesson",
  name: "Praktiskā nodarbība šautuvē ar sertificētu instruktoru (30 šāvieni)",
  title: "Praktiskā nodarbība",
  amountCents: 7000,
  vatRate: 21,
  currency: "EUR",
  includesCourse: false,
  includesLesson: true,
} as const satisfies Product;

export const BUNDLE_PRODUCT = {
  code: "bundle",
  name: "Sagatavošanas kurss (pilna piekļuve) + praktiskā nodarbība šautuvē ar sertificētu instruktoru (30 šāvieni)",
  title: "Kurss + praktiskā nodarbība",
  amountCents: 18000,
  vatRate: 21,
  currency: "EUR",
  includesCourse: true,
  includesLesson: true,
} as const satisfies Product;

/** Bijušais testa pirkums (1,50 €) — vairs netiek pārdots; atstāts vēsturiskajiem pasūtījumiem (atver kursu). */
export const TEST_PRODUCT = {
  code: "test",
  name: "Ieroču aprites kvalifikācijas pārbaudījuma sagatavošanas kurss — testa pirkums",
  title: "Testa pirkums",
  amountCents: 150,
  vatRate: 21,
  currency: "EUR",
  includesCourse: true,
  includesLesson: false,
} as const satisfies Product;

export const PRODUCTS: Record<ProductCode, Product> = {
  course: COURSE_PRODUCT,
  lesson: LESSON_PRODUCT,
  bundle: BUNDLE_PRODUCT,
  test: TEST_PRODUCT,
};

/** Produkti, kas atver tiešsaistes kursu (piekļuves pārbaudei). */
export const COURSE_ACCESS_CODES = (Object.keys(PRODUCTS) as ProductCode[]).filter((c) => PRODUCTS[c].includesCourse);

/** Produkti ar praktisko nodarbību. */
export const LESSON_CODES = (Object.keys(PRODUCTS) as ProductCode[]).filter((c) => PRODUCTS[c].includesLesson);

export const isProductCode = (v: unknown): v is ProductCode => typeof v === "string" && v in PRODUCTS;
/** Produkti, ko var nopirkt (secībā, kādā tos rāda). */
export const PURCHASABLE: ProductCode[] = ["course", "bundle", "lesson"];
export const isPurchasable = (v: unknown): v is ProductCode => PURCHASABLE.includes(v as ProductCode);
export const productByCode = (code: ProductCode) => PRODUCTS[code];
/** Pirkuma lapas adrese konkrētam produktam. */
export const buyPath = (code: ProductCode) => (code === "course" ? "/iegadaties" : `/iegadaties?produkts=${code}`);

/** Ko nodarbība ietver — vienā vietā sākumlapai, pirkuma lapai un noteikumiem. */
export const LESSON_INCLUDES = [
  "Iepazīšanās ar kaujas ieroci",
  "30 izmēģinājuma šāvieni ar sertificētu instruktoru mūsu šautuvē",
] as const;
export const LESSON_SCHEDULING =
  "Praktiskās nodarbības datums un laiks tiek saskaņots pēc iegādes — administrators ar tevi sazināsies.";

/** Bruto summa (ar PVN) → { net, vat } centos; noapaļo neto, PVN = starpība, lai summa sakristu. */
export function splitVat(grossCents: number, vatRate: number) {
  const net = Math.round((grossCents * 100) / (100 + vatRate));
  return { netCents: net, vatCents: grossCents - net };
}
