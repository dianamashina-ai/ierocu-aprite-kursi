import { readNumbers } from "@/lib/content/numbers";
import { getCourseOverview } from "@/lib/content/queries";
import { NumberCards } from "@/components/numbers/number-cards";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Skaitļi, kas jāatceras",
  description: "Vecumi, termiņi, limiti un sodi no Ieroču aprites likuma un MK noteikumiem — kartītēs.",
};

export default async function NumbersPage() {
  const cards = readNumbers();
  const course = await getCourseOverview();
  const topicTitles = Object.fromEntries(course.modules.flatMap((m) => m.topics.map((t) => [t.id, t.titleLv])));
  const modules = course.modules.map((m) => ({ id: m.id, order: m.order, title: m.titleLv }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold">Skaitļi, kas jāatceras</h1>
      <p className="mt-2 text-muted">
        Vecumi, termiņi, limiti un sodi — eksāmenā tos jautā visbiežāk. Katram skaitlim norādīts avots.
      </p>
      <div className="mt-6">
        <NumberCards cards={cards} modules={modules} topicTitles={topicTitles} />
      </div>
    </div>
  );
}
