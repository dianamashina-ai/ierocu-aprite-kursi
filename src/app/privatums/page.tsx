import Link from "next/link";
import { SELLER } from "@/config/seller";
import { H2, LegalPage, List } from "@/components/legal/legal-page";

export const metadata = { title: "Privātuma politika", description: "Kā vietne ierocuatlauja.lv apstrādā personas datus." };

const a = "font-semibold text-accent-strong underline underline-offset-4";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privātuma politika">
      <p>
        Šajā politikā skaidrots, kādus personas datus mēs apstrādājam, kad izmantojat mācību platformu {SELLER.website}, kāpēc
        tas ir vajadzīgs un kādas ir jūsu tiesības. Mēs vācam tikai to, kas nepieciešams kursa darbībai.
      </p>

      <H2>1. Pārzinis</H2>
      <p>
        Personas datu pārzinis ir {SELLER.name}, reģistrācijas Nr. {SELLER.regNo}, juridiskā adrese: {SELLER.address}.
        Jautājumi par datu apstrādi:{" "}
        <a href={`mailto:${SELLER.email}`} className={a}>
          {SELLER.email}
        </a>
        .
      </p>

      <H2>2. Kādus datus apstrādājam</H2>
      <List>
        <li>
          <strong>Konta dati:</strong> e-pasta adrese, vārds (ja to norādāt) un parole šifrētā (jauktā) veidā — pašu paroli mēs
          neredzam.
        </li>
        <li>
          <strong>Mācību dati:</strong> jūsu atbildes uz jautājumiem, progress pa tēmām, kļūdu saraksts un izmēģinājuma eksāmenu
          rezultāti.
        </li>
        <li>
          <strong>Pirkuma dati:</strong> rēķinā norādītais vārds un uzvārds, summa, apmaksas datums, rēķina numurs un apliecinājums
          par atteikuma tiesību zaudēšanu. Bankas kartes vai internetbankas datus apstrādā maksājumu pakalpojuma sniedzējs —
          mēs tos nesaņemam un neglabājam.
        </li>
        <li>
          <strong>Tehniskie dati:</strong> pieslēgšanās sesijas laikā — IP adrese un pārlūkprogrammas veids, lai aizsargātu
          kontu pret nesankcionētu piekļuvi.
        </li>
        <li>
          <strong>Sarakste:</strong> ja rakstāt mums uz e-pastu, apstrādājam jūsu vēstuli un atbildi uz to.
        </li>
      </List>

      <H2>3. Kāpēc un uz kāda pamata</H2>
      <List>
        <li>
          <strong>Līguma izpilde</strong> — lai izveidotu kontu, nodrošinātu kursu, saglabātu progresu, pieņemtu maksājumu un
          nosūtītu pieslēgšanās saites un rēķinus.
        </li>
        <li>
          <strong>Juridisks pienākums</strong> — rēķinu un grāmatvedības dokumentu glabāšana.
        </li>
        <li>
          <strong>Leģitīmās intereses</strong> — vietnes un kontu drošība, kļūdu novēršana un atbildes uz jūsu jautājumiem.
        </li>
      </List>
      <p>Mēs nepārdodam datus, neizmantojam tos reklāmai un nesūtām jaunumu vēstules bez jūsu piekrišanas.</p>

      <H2>4. Kas vēl apstrādā datus mūsu uzdevumā</H2>
      <p>Lai platforma darbotos, izmantojam uzticamus pakalpojumu sniedzējus (apstrādātājus):</p>
      <List>
        <li>
          <strong>Vercel</strong> — vietnes mitināšana (serveri Eiropas Savienībā, Frankfurtē);
        </li>
        <li>
          <strong>Neon</strong> — datubāze (serveri Eiropas Savienībā, Frankfurtē);
        </li>
        <li>
          <strong>Resend</strong> — vietnes e-pasta vēstuļu nosūtīšana (serveri Eiropas Savienībā, Īrijā);
        </li>
        <li>
          <strong>Google</strong> — mūsu e-pasta sarakste (Google Workspace) un, ja to izvēlaties, pieslēgšanās ar Google
          kontu;
        </li>
        <li>
          <strong>maksājumu pakalpojuma sniedzējs</strong> — maksājuma apstrāde.
        </li>
      </List>
      <p>
        Daži no šiem uzņēmumiem atrodas ārpus Eiropas Ekonomikas zonas (piemēram, ASV). Ja dati tiek nodoti ārpus tās, tas notiek,
        pamatojoties uz Eiropas Komisijas lēmumu par atbilstību (ES un ASV datu privātuma regulējums) vai standarta līguma
        klauzulām.
      </p>

      <H2>5. Cik ilgi glabājam</H2>
      <List>
        <li>Konta un mācību datus — kamēr jums ir konts. Pēc konta dzēšanas tie tiek izdzēsti.</li>
        <li>Rēķinus un pirkuma datus — Grāmatvedības likumā noteikto termiņu, arī pēc konta dzēšanas.</li>
        <li>Sesijas tehniskos datus — kamēr sesija ir aktīva (ne ilgāk par 60 dienām).</li>
        <li>E-pasta saraksti — kamēr tā vajadzīga jūsu jautājuma atrisināšanai.</li>
      </List>

      <H2>6. Jūsu tiesības</H2>
      <p>Jums ir tiesības:</p>
      <List>
        <li>saņemt informāciju par saviem datiem un to kopiju;</li>
        <li>labot neprecīzus datus (vārdu, e-pastu un paroli varat mainīt sadaļā «Mans konts»);</li>
        <li>pieprasīt datu dzēšanu (ciktāl tie nav jāglabā likumā noteiktā kārtā);</li>
        <li>ierobežot apstrādi vai iebilst pret to;</li>
        <li>saņemt savus datus pārnesamā formātā.</li>
      </List>
      <p>
        Lai izmantotu šīs tiesības vai dzēstu kontu, rakstiet uz{" "}
        <a href={`mailto:${SELLER.email}`} className={a}>
          {SELLER.email}
        </a>{" "}
        no konta e-pasta adreses. Atbildēsim viena mēneša laikā. Ja uzskatāt, ka jūsu dati tiek apstrādāti nelikumīgi, varat
        iesniegt sūdzību Datu valsts inspekcijā (www.dvi.gov.lv).
      </p>

      <H2>7. Sīkdatnes</H2>
      <p>
        Mēs izmantojam tikai vietnes darbībai nepieciešamās sīkdatnes — lai jūs paliktu pieslēgts. Analītikas vai reklāmas
        sīkdatņu nav. Sīkāk —{" "}
        <Link href="/sikdatnes" className={a}>
          Sīkdatņu politikā
        </Link>
        .
      </p>

      <H2>8. Izmaiņas</H2>
      <p>
        Ja politika mainīsies, atjaunināto versiju publicēsim šajā lapā un norādīsim izmaiņu datumu. Par būtiskām izmaiņām
        informēsim pa e-pastu.
      </p>
    </LegalPage>
  );
}
