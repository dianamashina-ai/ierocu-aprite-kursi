import { READY_LAST_EXAMS } from "@/lib/progress/readiness";
import type { PracticeQuestion } from "@/lib/quiz/types";
import {
  HowItWorksShowcase,
  type ShowcaseLesson,
} from "@/components/home/how-it-works-showcase";

/** Sākumlapa viesiem: trīs soļi (pa kreisi) un īsts treniņa jautājuma paraugs (pa labi). */
export function HowItWorks({
  modules,
  questions,
  examQuestions,
  examMinutes,
  sample,
  lesson,
}: {
  modules: number;
  questions: number;
  examQuestions: number;
  examMinutes: number;
  sample: PracticeQuestion | null;
  lesson: ShowcaseLesson;
}) {
  const steps = [
    {
      title: "Mācies",
      text: `${modules} moduļi — no ieroča uzbūves līdz atbildībai. Īsas nodarbības latviešu valodā pēc likuma teksta.`,
    },
    {
      title: "Trenējies",
      text: `Visi ${questions} oficiālie jautājumi. Pēc katras atbildes — skaidrojums un atsauce uz likumu. Kļūdas atgriežas, līdz tās apgūsti.`,
    },
    {
      title: "Pārbaudi sevi",
      text: `Izmēģinājuma eksāmens kā īstajā: ${examQuestions} jautājumi, ${examMinutes} minūtes. Nokārto ${READY_LAST_EXAMS} pēc kārtas — un esi gatavs.`,
    },
  ];
  return (
    <section
      id="ka-notiek"
      aria-labelledby="ka-notiek-h"
      className="scroll-mt-6 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <HowItWorksShowcase
          intro={
            <>
              <h2
                id="ka-notiek-h"
                className="text-4xl font-semibold tracking-tight sm:text-5xl"
              >
                Kā notiek mācības
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Mācies datorā vai telefonā — pilnīgi savā tempā un ritmā.
                Progress saglabājas, un vari turpināt tur, kur palikāt.
              </p>
            </>
          }
          steps={steps}
          sample={sample}
          lesson={lesson}
          examQuestions={examQuestions}
          examMinutes={examMinutes}
        />
      </div>
    </section>
  );
}
