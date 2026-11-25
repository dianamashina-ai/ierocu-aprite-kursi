import Link from "next/link";
import { SELLER } from "@/config/seller";
import { BUNDLE_PRODUCT, COURSE_PRODUCT, LESSON_PRODUCT, splitVat } from "@/config/pricing";
import { formatEuro } from "@/lib/format";
import { H2, LegalPage, List } from "@/components/legal/legal-page";

export const metadata = {
  title: "Lietošanas un pirkšanas noteikumi",
  description: "Mācību platformas ierocuatlauja.lv lietošanas un pirkšanas noteikumi.",
};

const a = "font-semibold text-accent-strong underline underline-offset-4";

/** Pirms palaišanas ieteicams pārskatīt juristam. */
export default function TermsPage() {
  const price = (p: { amountCents: number; vatRate: number }) =>
    `${formatEuro(p.amountCents)} ar PVN ${p.vatRate} % (${formatEuro(splitVat(p.amountCents, p.vatRate).vatCents)})`;
  const lessonPartRefund = BUNDLE_PRODUCT.amountCents - COURSE_PRODUCT.amountCents;
  return (
    <LegalPage title="Lietošanas un pirkšanas noteikumi">
      <p>
        Šie noteikumi attiecas uz mācību platformas {SELLER.website} lietošanu, pilnas piekļuves un praktiskās nodarbības iegādi. Izveidojot kontu vai
        veicot pirkumu, jūs piekrītat šiem noteikumiem.
      </p>

      <H2>1. Pakalpojuma sniedzējs</H2>
      <p>
        {SELLER.name}, reģistrācijas Nr. {SELLER.regNo}, PVN maksātāja Nr. {SELLER.vatNo}, juridiskā adrese: {SELLER.address}.
        E-pasts:{" "}
        <a href={`mailto:${SELLER.email}`} className={a}>
          {SELLER.email}
        </a>
        .
      </p>

      <H2>2. Pakalpojums</H2>
      <p>
        Tiešsaistes mācību platforma sagatavošanās kvalifikācijas pārbaudījumam par ieroču un munīcijas aprites kārtību un
        prasmēm rīkoties ar ieroci. Platforma ietver tēmas, oficiālos pārbaudījuma jautājumus ar skaidrojumiem, treniņus un
        izmēģinājuma eksāmenu.
      </p>
      <p>
        Tas <strong>nav oficiālais pārbaudījums</strong>, un platforma nav saistīta ar Valsts policiju. Kvalifikācijas pārbaudījumu
        pieņem Valsts policija.
      </p>
      <p>1. modulis ir pieejams bez maksas. Pilna piekļuve atver visus moduļus, tēmas, skaidrojumus un izmēģinājuma eksāmenu.</p>
      <p>
        <strong>Praktiskā nodarbība</strong> notiek pakalpojuma sniedzēja šautuvē ar sertificētu instruktoru un ietver iepazīšanos ar
        kaujas ieroci un 30 izmēģinājuma šāvienus. Nodarbības datumu un laiku saskaņo pēc iegādes — administrators sazinās ar
        pircēju pa tālruni vai e-pastu. Nodarbību var iegādāties atsevišķi vai komplektā ar pilnu piekļuvi kursam.
      </p>

      <H2>3. Konts un lietošana</H2>
      <List>
        <li>Konts ir personīgs. Nenododiet savus pieslēgšanās datus citām personām un neļaujiet citiem izmantot savu kontu.</li>
        <li>
          Vienlaikus kontā var būt pieslēgts ne vairāk kā divās ierīcēs. Pieslēdzoties trešajā, vecākā ierīce tiek automātiski
          izrakstīta.
        </li>
        <li>Norādiet pareizu e-pasta adresi — uz to sūtām paroles atjaunošanas saites un rēķinus.</li>
        <li>
          Tēmu un skaidrojumu teksti ir pakalpojuma sniedzēja autordarbs. Tos nedrīkst kopēt, pārpublicēt vai izplatīt bez
          rakstiskas atļaujas.
        </li>
        <li>
          Ja konts tiek izmantots pretēji šiem noteikumiem (piemēram, piekļuve tiek tālāk pārdota vai kopīgota), mēs varam
          ierobežot piekļuvi.
        </li>
      </List>

      <H2>4. Cena un apmaksa</H2>
      <List>
        <li>Pilna piekļuve kursam — {price(COURSE_PRODUCT)}.</li>
        <li>Praktiskā nodarbība — {price(LESSON_PRODUCT)}.</li>
        <li>Pilna piekļuve kursam + praktiskā nodarbība — {price(BUNDLE_PRODUCT)}.</li>
      </List>
      <p>
        Katrs pirkums ir <strong>vienreizējs maksājums</strong>, nevis abonements — atkārtoti maksājumi netiek iekasēti. Apmaksa
        notiek tiešsaistē caur maksājumu pakalpojuma sniedzēju.
      </p>
      <p>
        Pēc apmaksas pirkums tiek piesaistīts jūsu kontam uzreiz, un uz konta e-pastu tiek nosūtīts elektronisks PVN rēķins.
        Rēķini pieejami arī sadaļā «Mans konts». Pakalpojums paredzēts fiziskām personām.
      </p>

      <H2>5. Piekļuves termiņš</H2>
      <p>
        Pilnai piekļuvei nav noteikta beigu termiņa — tā ir spēkā, kamēr platforma darbojas. Ja platformas darbību paredzēts
        izbeigt, lietotājus par to informēsim pa e-pastu vismaz 30 dienas iepriekš.
      </p>

      <H2>6. Atteikuma tiesības</H2>
      <p>
        Pilna piekļuve kursam ir digitālais saturs, ko nodrošina uzreiz pēc apmaksas. Pirms apmaksas pircējs nepārprotami piekrīt tūlītējai
        satura piegādei un apliecina, ka zina: līdz ar to viņš zaudē 14 dienu atteikuma tiesības.
      </p>
      <p>
        Praktiskās nodarbības pirkumam ir 14 dienu atteikuma tiesības no pirkuma dienas. Ja pēc jūsu lūguma nodarbība notiek
        šajā laikā, atteikuma tiesības beidzas, kad nodarbība ir notikusi. Lai atteiktos, rakstiet uz{" "}
        <a href={`mailto:${SELLER.email}`} className={a}>
          {SELLER.email}
        </a>
        ; naudu atmaksāsim 14 dienu laikā. Ja iegādāta tikai praktiskā nodarbība, atmaksājam visu summu —{" "}
        {formatEuro(LESSON_PRODUCT.amountCents)}. Komplektā atteikuma tiesības attiecas tikai uz nodarbību — atmaksājam{" "}
        {formatEuro(lessonPartRefund)}.
      </p>
      <p>
        Ja apmaksātā piekļuve tehnisku iemeslu dēļ netika atvērta vai maksājums tika iekasēts kļūdaini, rakstiet mums — situāciju
        atrisināsim vai naudu atmaksāsim.
      </p>

      <H2>7. Satura precizitāte un atbildība</H2>
      <List>
        <li>
          Skaidrojumi un tēmas ir mācību materiāls, kas sagatavots pēc spēkā esošajiem tiesību aktiem. Noteicošais vienmēr ir
          tiesību aktu teksts.
        </li>
        <li>
          Oficiālo jautājumu atbildes tiek rādītas tādas, kādas tās ir Valsts policijas jautājumu sarakstā. Ja likums ir mainījies,
          pie jautājuma ir atzīme «Uzmanīgi!».
        </li>
        <li>Platforma palīdz sagatavoties, bet negarantē pārbaudījuma nokārtošanu.</li>
        <li>
          Ja pamanāt kļūdu, lūdzu, rakstiet mums, norādot jautājuma numuru — to izlabosim.
        </li>
      </List>

      <H2>8. Pretenzijas</H2>
      <p>
        Pretenzijas un jautājumus sūtiet uz{" "}
        <a href={`mailto:${SELLER.email}`} className={a}>
          {SELLER.email}
        </a>
        . Atbildēsim iespējami ātri. Ja strīdu neizdodas atrisināt sarunu ceļā, patērētājs var vērsties Patērētāju tiesību
        aizsardzības centrā (www.ptac.gov.lv).
      </p>

      <H2>9. Personas dati</H2>
      <p>
        Kā apstrādājam personas datus, skaidrots{" "}
        <Link href="/privatums" className={a}>
          Privātuma politikā
        </Link>
        .
      </p>

      <H2>10. Noteikumu izmaiņas</H2>
      <p>
        Noteikumus varam atjaunināt. Spēkā esošā versija vienmēr ir publicēta šajā lapā. Izmaiņas neattiecas uz jau veiktu pirkumu
        cenu un piekļuves apjomu.
      </p>
    </LegalPage>
  );
}
