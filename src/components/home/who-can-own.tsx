import { Check } from "lucide-react";

/** Sākumlapa: īsi — kas var kļūt par ieroča īpašnieku (tikai pēc content/law tekstiem). */
const ITEMS: { title: string; text: string; highlight?: boolean }[] = [
  { title: "Vecums", text: "no 18 gadiem; pistolei, revolverim un vītņstobra medību ierocim — no 21 gada" },
  { title: "Pilsonība", text: "Latvijas, ES vai EEZ pilsonis vai noteiktu valstu pilsonis ar pastāvīgās uzturēšanās atļauju" },
  { title: "Veselība", text: "veselības pārbaude bez medicīniskām pretindikācijām" },
  { title: "Pirmā palīdzība", text: "kursa apliecība (vismaz 12 stundas) vai medicīniskā izglītība" },
  { title: "Kvalifikācijas pārbaudījums", text: "eksāmens pirms pirmā šaujamieroča iegādes — šis kurss sagatavo tieši tam", highlight: true },
  { title: "Nav šķēršļu", text: "nav nedzēstas sodāmības, deklarēta dzīvesvieta Latvijā, seifs ieroča glabāšanai" },
];

export function WhoCanOwn() {
  return (
    <section id="prasibas" aria-labelledby="who-h" className="scroll-mt-6 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-24">
        <div>
          <h2 id="who-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">Kas var kļūt par ieroča īpašnieku</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">Galvenās prasības pirms pirmā šaujamieroča iegādes.</p>
        </div>
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {ITEMS.map(({ title, text, highlight }) => (
              <li key={title} className="flex gap-4 py-4">
                <Check aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${highlight ? "text-accent" : "text-ok"}`} strokeWidth={2.5} />
                <p className={highlight ? "font-semibold text-accent-strong" : ""}>
                  <span className="font-semibold">{title}</span> — {text}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Avoti: Ieroču aprites likums, 14., 23., 27. un 28. pants; MK noteikumi Nr. 211, 3.1. apakšpunkts. Medību ieročiem eksāmena vietā vajadzīga mednieka apliecība.
          </p>
        </div>
      </div>
    </section>
  );
}
