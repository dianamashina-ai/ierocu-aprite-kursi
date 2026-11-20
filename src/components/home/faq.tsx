import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { COURSE_PRODUCT } from "@/config/pricing";
import { formatEuro } from "@/lib/format";

/**
 * Biežāk uzdotie jautājumi sākumlapā. Fakti par eksāmenu — MK noteikumi Nr. 191 un Ieroču aprites likums;
 * fakti par platformu — cenu konfigurācija un lietošanas noteikumi.
 */
function items(exam: { questions: number; minutes: number; maxWrong: number }, totalQuestions: number) {
  return [
    {
      q: "Kas pieņem kvalifikācijas pārbaudījumu?",
      a: "Pārbaudījumu organizē Valsts policija. Lai to kārtotu, Valsts policijā iesniedz pieteikumu, un tā informē par pārbaudījuma laiku. Pārbaudījumu kārto valsts valodā.",
      src: "MK noteikumi Nr. 191, 2., 4., 6. un 8. punkts",
    },
    {
      q: "Vai šī platforma ir saistīta ar Valsts policiju?",
      a: "Nē. Šī ir neatkarīga mācību platforma eksāmena sagatavošanai, ko piedāvā SIA „Latvijas Praktiskās Šaušanas Centrs”. Tā nav oficiālais eksāmens.",
    },
    {
      q: "Kā notiek eksāmens?",
      a: `Pārbaudījumu kārto datorā: ${exam.questions} jautājumi, ${exam.minutes} minūtes. Tas ir nokārtots, ja pieļautas ne vairāk kā ${exam.maxWrong} nepareizas vai neatbildētas atbildes. Rezultāts parādās uzreiz pēc pārbaudījuma.`,
      src: "MK noteikumi Nr. 191, 18.–20. punkts",
    },
    {
      q: "Kam šis eksāmens jākārto?",
      a: "Pirms pirmā šaujamieroča vai lielas enerģijas pneimatiskā ieroča iegādes. Medībām klasificētiem ieročiem kvalifikācijas pārbaudījums nav jākārto — tiem vajadzīga mednieka apliecība.",
      src: "Ieroču aprites likums, 28. pants",
    },
    {
      q: "Vai platformā ir tie paši jautājumi, kas eksāmenā?",
      a: `Platformā ir visi ${totalQuestions} Valsts policijas publicētie kvalifikācijas pārbaudījuma testa jautājumi (2026. gada precizētā versija) ar oficiālajām atbildēm. Pie katra jautājuma ir skaidrojums ar atsauci uz likumu.`,
    },
    {
      q: "Ko darīt, ja nenokārtoju eksāmenu?",
      a: "Pārbaudījumu var kārtot atkārtoti, arī vairākas reizes. Katru reizi jāiesniedz jauns pieteikums un jāsamaksā valsts nodeva.",
      src: "MK noteikumi Nr. 191, 22. punkts",
    },
    {
      q: "Kas ir pieejams bez maksas?",
      a: "Pēc reģistrācijas 1. modulis ir pieejams bez maksas — nodarbības, jautājumi un skaidrojumi. Maksājumu karte nav vajadzīga.",
    },
    {
      q: "Cik maksā pilns kurss un kā to apmaksāt?",
      a: `${formatEuro(COURSE_PRODUCT.amountCents)} ar PVN — vienreizējs maksājums, nevis abonements. Apmaksa notiek tiešsaistē, un PVN rēķins tiek nosūtīts uz e-pastu.`,
    },
    {
      q: "Vai varu atteikties no pirkuma?",
      a: "Pilna piekļuve ir digitālais saturs, kas tiek atvērts uzreiz pēc apmaksas. Pirms apmaksas tu piekrīti tūlītējai piekļuvei, un tādēļ 14 dienu atteikuma tiesības vairs nav piemērojamas.",
      link: { href: "/noteikumi", label: "Lietošanas un pirkšanas noteikumi" },
    },
    {
      q: "Kas notiek, ja likums mainās?",
      a: "Skaidrojumi un nodarbības ir rakstīti pēc spēkā esošās likuma redakcijas. Ja oficiālā atbilde var neatbilst jaunākajiem grozījumiem, pie jautājuma ir atzīme «Likuma izmaiņas» ar paskaidrojumu un oficiālo atbildi no Valsts policijas saraksta.",
    },
  ];
}

export function Faq({ exam, totalQuestions }: { exam: { questions: number; minutes: number; maxWrong: number }; totalQuestions: number }) {
  const list = items(exam, totalQuestions);
  return (
    <section id="buj" aria-labelledby="buj-h" className="scroll-mt-6 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:py-24">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <h2 id="buj-h" className="text-5xl font-semibold tracking-tight sm:text-6xl">Biežāk uzdotie jautājumi</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Par eksāmenu, platformu un apmaksu. Ja neatradi atbildi, izmēģini 1. moduli — tas ir bez maksas.
          </p>
          <Link href="/registreties" className="btn-primary mt-8 gap-2">
            Sākt bez maksas <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <ul className="border-t border-line">
          {list.map((it) => (
            <li key={it.q} className="border-b border-line">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-5 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 text-lg font-semibold leading-snug group-hover:text-accent">{it.q}</span>
                  <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="pb-7 pr-10">
                  <p className="text-[16px] leading-relaxed text-muted">{it.a}</p>
                  {it.link && (
                    <Link href={it.link.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent">
                      {it.link.label} <ArrowUpRight aria-hidden="true" className="size-4" />
                    </Link>
                  )}
                  {it.src && <p className="mt-3 text-xs text-muted">{it.src}</p>}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
