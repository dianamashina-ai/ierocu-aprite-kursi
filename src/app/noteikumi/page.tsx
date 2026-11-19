import Link from "next/link";
import { SELLER } from "@/config/seller";
import { COURSE_PRODUCT, splitVat } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

export const metadata = { title: "Lietošanas un pirkšanas noteikumi" };

/** MELNRAKSTS — pirms publicēšanas jāpārskata juristam (6. posms). */
export default function TermsPage() {
  const { vatCents } = splitVat(COURSE_PRODUCT.amountCents, COURSE_PRODUCT.vatRate);
  const h = "mt-8 text-xl font-semibold";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Lietošanas un pirkšanas noteikumi</h1>
      <p className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">Melnraksts — tiek precizēts.</p>
      <div className="mt-6 space-y-3 leading-relaxed">
        <h2 className={h}>1. Pārdevējs</h2>
        <p>
          {SELLER.name}, reģistrācijas Nr. {SELLER.regNo}, PVN maksātāja Nr. {SELLER.vatNo}, juridiskā adrese: {SELLER.address}.
        </p>
        <h2 className={h}>2. Pakalpojums</h2>
        <p>
          Tiešsaistes mācību platforma sagatavošanās kvalifikācijas pārbaudījumam par ieroču un munīcijas aprites kārtību un
          prasmēm rīkoties ar ieroci. Platforma nav oficiālais pārbaudījums un nav saistīta ar Valsts policiju. Skaidrojumi un
          nodarbības ir mācību materiāls; noteicošais vienmēr ir spēkā esošo tiesību aktu teksts.
        </p>
        <p>1. modulis ir pieejams bez maksas. Pilna piekļuve atver visus moduļus, nodarbības, skaidrojumus un izmēģinājuma eksāmenu.</p>
        <h2 className={h}>3. Cena un apmaksa</h2>
        <p>
          Pilnas piekļuves cena ir {formatEuro(COURSE_PRODUCT.amountCents)}, t. sk. PVN {COURSE_PRODUCT.vatRate} % (
          {formatEuro(vatCents)}). Tas ir vienreizējs maksājums, nevis abonements. Apmaksa notiek tiešsaistē caur maksājumu
          pakalpojuma sniedzēju. Pēc apmaksas piekļuve tiek piesaistīta lietotāja kontam, un uz konta e-pastu tiek nosūtīts
          elektronisks PVN rēķins.
        </p>
        <h2 className={h}>4. Atteikuma tiesības</h2>
        <p>
          Pakalpojums ir digitālais saturs, ko nodrošina uzreiz pēc apmaksas. Pirms apmaksas pircējs nepārprotami piekrīt
          tūlītējai satura piegādei un apliecina, ka zina: līdz ar to viņš zaudē 14 dienu atteikuma tiesības.
        </p>
        <h2 className={h}>5. Kontakti</h2>
        <p>
          Jautājumi par maksājumiem un rēķiniem — {SELLER.name}. <Link href="/" className="underline">Uz sākumu</Link>
        </p>
      </div>
    </div>
  );
}
