import { ClipboardCheck, GraduationCap, HeartPulse, IdCard, ShieldCheck, Stethoscope } from "lucide-react";

/** Sākumlapa: īss ievads, kas var kļūt par ieroča īpašnieku (tikai pēc content/law tekstiem). */
const ITEMS = [
  {
    icon: IdCard,
    title: "Vecums",
    text: "No 18 gadiem — gludstobra ieroči medībām, sportam un pašaizsardzībai. No 21 gada — pašaizsardzības pistole vai revolveris un vītņstobra medību ierocis.",
    source: "Ieroču aprites likums, 14. pants",
  },
  {
    icon: ShieldCheck,
    title: "Pilsonība vai uzturēšanās",
    text: "Latvijas, ES vai EEZ valsts pilsonis, kā arī noteiktu valstu pilsonis ar pastāvīgās uzturēšanās atļauju Latvijā.",
    source: "Ieroču aprites likums, 14. pants",
  },
  {
    icon: Stethoscope,
    title: "Veselības pārbaude",
    text: "Pirms atļaujas jāiziet veselības pārbaude: nedrīkst būt medicīnisku pretindikāciju, piemēram, atkarības vai psihisku traucējumu.",
    source: "Ieroču aprites likums, 27. pants",
  },
  {
    icon: HeartPulse,
    title: "Pirmā palīdzība",
    text: "Apliecība par pirmās palīdzības kursu (vismaz 12 stundas ar 3 stundu pārbaudi) vai medicīniskā izglītība.",
    source: "MK noteikumi Nr. 211, 3.1. apakšpunkts",
  },
  {
    icon: GraduationCap,
    title: "Kvalifikācijas pārbaudījums",
    text: "Pirms pirmā šaujamieroča iegādes jānokārto eksāmens par ieroču aprites kārtību. Medību ieročiem tā vietā vajadzīga mednieka apliecība.",
    source: "Ieroču aprites likums, 28. pants",
    highlight: true,
  },
  {
    icon: ClipboardCheck,
    title: "Nav šķēršļu",
    text: "Nav nedzēstas sodāmības par noziedzīgu nodarījumu, ir deklarēta dzīvesvieta Latvijā un glabāšanai piemērots seifs norādītajā adresē.",
    source: "Ieroču aprites likums, 23. pants",
  },
];

export function WhoCanOwn() {
  return (
    <section aria-labelledby="who-h" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-3xl">
          <h2 id="who-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">Kas var kļūt par ieroča īpašnieku</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Ieroci var iegādāties pieaugušais, kurš atbilst likuma prasībām un saņēmis ieroča atļauju. Lūk, galvenais, kas
            jāizpilda pirms pirmā šaujamieroča iegādes.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ icon: Icon, title, text, source, highlight }, i) => (
            <li
              key={title}
              className={`flex flex-col rounded-2xl border p-6 ${highlight ? "border-accent bg-accent text-white" : "border-line bg-white"}`}
            >
              <div className="flex items-center justify-between">
                <span
                  aria-hidden="true"
                  className={`flex size-11 items-center justify-center rounded-full ${highlight ? "bg-white/15 text-white" : "bg-accent-soft text-accent"}`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className={`text-xl font-extrabold tabular-nums ${highlight ? "text-white/70" : "text-accent"}`}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className={`mt-2 flex-1 text-[15px] leading-relaxed ${highlight ? "text-white/90" : "text-muted"}`}>{text}</p>
              {highlight && <p className="mt-4 text-sm font-semibold">Šis kurss sagatavo tieši šim solim.</p>}
              <p className={`mt-4 text-xs ${highlight ? "text-white/70" : "text-muted"}`}>{source}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
