import Link from "next/link";
import { SELLER } from "@/config/seller";
import { H2, LegalPage } from "@/components/legal/legal-page";

export const metadata = { title: "Sīkdatņu politika", description: "Kādas sīkdatnes izmanto vietne ierocuatlauja.lv." };

const a = "font-semibold text-accent-strong underline underline-offset-4";

export default function CookiesPage() {
  return (
    <LegalPage title="Sīkdatņu politika">
      <p>
        Sīkdatne ir neliels teksta fails, ko vietne saglabā jūsu pārlūkprogrammā. Vietne {SELLER.website} izmanto{" "}
        <strong>tikai vietnes darbībai nepieciešamās sīkdatnes</strong> — lai jūs paliktu pieslēgts savam kontam.
      </p>

      <H2>Izmantotās sīkdatnes</H2>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Nosaukums</th>
              <th className="px-4 py-3 font-semibold">Mērķis</th>
              <th className="px-4 py-3 font-semibold">Derīguma termiņš</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line align-top">
              <td className="px-4 py-3 font-mono text-[13px]">__Secure-better-auth.session_token</td>
              <td className="px-4 py-3">Pieslēgšanās sesija: ļauj palikt pieslēgtam, saglabāt progresu un atvērt apmaksāto saturu. Tiek iestatīta tikai pēc pieslēgšanās.</td>
              <td className="px-4 py-3">60 dienas vai līdz iziešanai</td>
            </tr>
            <tr className="border-t border-line align-top">
              <td className="px-4 py-3 font-mono text-[13px]">__Secure-better-auth.*</td>
              <td className="px-4 py-3">Īslaicīgas sīkdatnes pieslēgšanās ar Google drošībai (pārbauda, ka pieslēgšanos sāka tieši jūs). Tiek iestatītas tikai, izvēloties «Turpināt ar Google».</td>
              <td className="px-4 py-3">Dažas minūtes</td>
            </tr>
            <tr className="border-t border-line align-top">
              <td className="px-4 py-3 font-mono text-[13px]">admin_skats</td>
              <td className="px-4 py-3">Tikai platformas administratoriem: atceras izvēlēto skatu («Pilna piekļuve» vai «Bez maksas»).</td>
              <td className="px-4 py-3">30 dienas</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H2>Pārlūkprogrammas krātuve</H2>
      <p>
        Jautājumu sarakstā vietne pārlūkprogrammas krātuvē (localStorage) atceras, vai esat izvēlējies paslēpt pareizās atbildes.
        Šī informācija paliek tikai jūsu ierīcē, un mēs to nesaņemam.
      </p>

      <H2>Analītika un reklāma</H2>
      <p>
        Mēs neizmantojam analītikas, reklāmas vai sociālo tīklu sīkdatnes un neizsekojam jūsu darbības citās vietnēs. Tāpēc
        vietnē nav sīkdatņu piekrišanas loga — nepieciešamajām sīkdatnēm piekrišana nav vajadzīga.
      </p>

      <H2>Kā sīkdatnes pārvaldīt</H2>
      <p>
        Sīkdatni var izdzēst, nospiežot «Iziet» vai pārlūkprogrammas iestatījumos. Ja sīkdatnes bloķēsiet, varēsiet skatīt
        vietni, bet nevarēsiet pieslēgties savam kontam.
      </p>
      <p>
        Vairāk par personas datu apstrādi —{" "}
        <Link href="/privatums" className={a}>
          Privātuma politikā
        </Link>
        .
      </p>
    </LegalPage>
  );
}
