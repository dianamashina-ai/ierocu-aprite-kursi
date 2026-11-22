import { PageHeader, PAGE_CLASS } from "@/components/page-header";
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
    <div className={PAGE_CLASS}>
      <PageHeader title="Trenēties" lead="Izvēlies moduļus un sāc treniņu. Pēc katras atbildes redzēsi skaidrojumu ar atsauci uz likumu." />
      <TrainingBuilder modules={modules} />
    </div>
  );
}
