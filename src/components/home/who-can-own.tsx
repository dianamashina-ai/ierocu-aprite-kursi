import { Check } from "lucide-react";

/** Sākumlapa: īsi — kurš var kļūt par ieroča īpašnieku (tikai pēc content/law tekstiem). */
const ITEMS: { title: string; text: string }[] = [
  { title: "Vecums", text: "No 18 gadiem; pistolei, revolverim un vītņstobra medību ierocim — no 21 gada" },
  { title: "Pilsonība", text: "Latvijas, ES vai EEZ pilsonis vai noteiktu valstu pilsonis ar pastāvīgās uzturēšanās atļauju" },
  { title: "Veselība", text: "Veselības pārbaude bez medicīniskām pretindikācijām" },
  { title: "Pirmā palīdzība", text: "Kursa apliecība (vismaz 12 stundas) vai medicīniskā izglītība" },
  { title: "Kvalifikācijas pārbaudījums", text: "Eksāmens pirms pirmā šaujamieroča iegādes — šis kurss sagatavo tieši tam" },
  { title: "Nav šķēršļu", text: "Nav nedzēstas sodāmības, deklarēta dzīvesvieta Latvijā, seifs ieroča glabāšanai" },
];

export function WhoCanOwn() {
  return (
    <section id="prasibas" aria-labelledby="who-h" className="scroll-mt-6 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-3xl">
          <h2 id="who-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">Kurš var kļūt par ieroča īpašnieku</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">Galvenās prasības pirms pirmā šaujamieroča iegādes.</p>
        </div>
        <ul className="mt-10 grid gap-x-12 gap-y-6 sm:grid-cols-2">
          {ITEMS.map(({ title, text }) => (
            <li key={title} className="flex gap-3">
              <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ok" strokeWidth={2.5} />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
