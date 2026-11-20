import Link from "next/link";
import { Mail, MapPin, Building2 } from "lucide-react";
import { SELLER } from "@/config/seller";
import { H2, LegalPage } from "@/components/legal/legal-page";

export const metadata = { title: "Kontakti", description: "Kā sazināties ar mācību platformu ierocuatlauja.lv." };

const a = "font-semibold text-accent-strong underline underline-offset-4";

export default function ContactsPage() {
  return (
    <LegalPage title="Kontakti" updated={false}>
      <p>Jautājumi par kursu, kontu, maksājumiem vai rēķiniem — rakstiet mums, atbildēsim darba dienu laikā.</p>

      <div className="grid gap-4 pt-2 sm:grid-cols-2">
        <a href={`mailto:${SELLER.email}`} className="group rounded-2xl border border-line bg-white p-6 transition-colors hover:border-accent">
          <Mail aria-hidden="true" className="size-5 text-accent" />
          <p className="mt-4 text-sm text-muted">E-pasts</p>
          <p className="mt-1 text-lg font-semibold group-hover:text-accent-strong">{SELLER.email}</p>
        </a>
        <div className="rounded-2xl border border-line bg-white p-6">
          <Building2 aria-hidden="true" className="size-5 text-accent" />
          <p className="mt-4 text-sm text-muted">Pakalpojuma sniedzējs</p>
          <p className="mt-1 font-semibold">{SELLER.name}</p>
          <p className="mt-1 text-sm text-muted">
            Reģ. Nr. {SELLER.regNo} · PVN Nr. {SELLER.vatNo}
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {SELLER.address}
          </p>
        </div>
      </div>

      <H2>Pirms rakstāt</H2>
      <ul className="list-disc space-y-2 pl-6 marker:text-muted">
        <li>
          Paroli var atjaunot pats —{" "}
          <Link href="/parole/aizmirsta" className={a}>
            «Aizmirsi paroli?»
          </Link>
          .
        </li>
        <li>
          Rēķini un piekļuves statuss ir sadaļā{" "}
          <Link href="/konts" className={a}>
            «Mans konts»
          </Link>
          .
        </li>
        <li>
          Par jautājumu saturu rakstot, norādiet jautājuma numuru (piem., «Nr. 435») — tā atbildēsim ātrāk.
        </li>
      </ul>

      <p className="pt-4 text-sm text-muted">
        Kvalifikācijas pārbaudījumu pieņem Valsts policija. Šī ir mācību platforma — par pieteikšanos eksāmenam un ieroču
        atļaujām jāvēršas Valsts policijā.
      </p>
    </LegalPage>
  );
}
