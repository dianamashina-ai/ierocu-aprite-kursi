import { BookOpen, ClipboardCheck, Repeat } from "lucide-react";
import { READY_LAST_EXAMS } from "@/lib/progress/readiness";
import type { PracticeQuestion } from "@/lib/quiz/types";
import { SampleQuestion } from "@/components/home/hero";

/** Sākumlapa viesiem: trīs soļi (pa kreisi) un īsts treniņa jautājuma paraugs (pa labi). */
export function HowItWorks({
  modules,
  questions,
  examQuestions,
  examMinutes,
  sample,
}: {
  modules: number;
  questions: number;
  examQuestions: number;
  examMinutes: number;
  sample: PracticeQuestion | null;
}) {
  const steps = [
    {
      icon: BookOpen,
      title: "Mācies",
      text: `${modules} moduļi — no ieroča uzbūves līdz atbildībai. Īsas nodarbības latviešu valodā pēc likuma teksta.`,
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
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-20 lg:py-24">
        <div>
          <h2 id="ka-notiek-h" className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Kā notiek mācības
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Mācies datorā vai telefonā — pilnīgi savā tempā un ritmā. Progress saglabājas, un vari turpināt tur, kur palikāt.
          </p>
          <ol className="mt-10 space-y-8">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    <span className="mr-2 tabular-nums text-accent-strong">{i + 1}.</span>
                    {title}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {sample && <SampleQuestion q={sample} />}
      </div>
    </section>
  );
}
