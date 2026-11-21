import { requireUser } from "@/lib/auth/session";
import { getCourseOverview } from "@/lib/content/queries";
import { hasFullAccess, isFreeModule } from "@/lib/billing/access";
import { getMistakesByModule } from "@/lib/training/service";
import { TrainingBuilder, type BuilderModule } from "@/components/training/training-builder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trenēties" };

export default async function TrainingPage() {
  const user = await requireUser("/trenins");
  const [course, access, mistakes] = await Promise.all([getCourseOverview(), hasFullAccess(user.id), getMistakesByModule(user.id)]);
  const modules: BuilderModule[] = course.modules.map((m) => ({
    id: m.id,
    order: m.order,
    title: m.titleLv,
    locked: !access && !isFreeModule(m.id),
    questions: m.questionCount,
    mistakes: mistakes.get(m.id) ?? 0,
  }));

  return (
    <div className="page-white mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Trenēties</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Izvēlies moduļus un sāc treniņu. Pēc katras atbildes redzēsi skaidrojumu ar atsauci uz likumu.</p>
      <div className="mt-8">
        <TrainingBuilder modules={modules} />
      </div>
    </div>
  );
}
