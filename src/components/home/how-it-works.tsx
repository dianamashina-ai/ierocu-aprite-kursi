import { BookOpen, ClipboardCheck, Repeat } from "lucide-react";
import { READY_LAST_EXAMS } from "@/lib/progress/readiness";

/** Sākumlapa viesiem: trīs soļi — mācies, trenējies, pārbaudi sevi. */
export function HowItWorks({ topics, questions, examQuestions, examMinutes }: { topics: number; questions: number; examQuestions: number; examMinutes: number }) {
  const steps = [
    {
      icon: BookOpen,
      title: "Mācies",
      text: `${topics} īsas nodarbības latviešu valodā pēc likuma teksta — ar piemēriem un biežākajām kļūdām.`,
    },
    {
      icon: Repeat,
      title: "Trenējies",
      text: `Visi ${questions} oficiālie jautājumi. Pēc katras atbildes — skaidrojums un atsauce uz likumu. Kļūdas atgriežas, līdz tās apgūsti.`,
    },
    {
      icon: ClipboardCheck,
      title: "Pārbaudi sevi",
      text: `Izmēģinājuma eksāmens kā īstajā: ${examQuestions} jautājumi, ${examMinutes} minūtes. Nokārto ${READY_LAST_EXAMS} pēc kārtas — un esi gatavs.`,
    },
  ];
  return (
    <section id="ka-notiek" aria-labelledby="ka-notiek-h" className="scroll-mt-6 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <h2 id="ka-notiek-h" className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Kā notiek mācības
        </h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex flex-col rounded-2xl border border-line bg-white p-6">
              <div className="flex items-start justify-between">
                <span className="text-2xl font-bold tabular-nums text-accent-strong">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
