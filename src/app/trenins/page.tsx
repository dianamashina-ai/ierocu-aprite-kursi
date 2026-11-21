import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getCourseOverview } from "@/lib/content/queries";
import { hasFullAccess, isFreeModule } from "@/lib/billing/access";
import { getDueReviewIds } from "@/lib/progress/service";
import { getMistakesByTopic } from "@/lib/training/service";
import { plural } from "@/lib/format";
import { TrainingBuilder, type BuilderModule } from "@/components/training/training-builder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trenēties" };

export default async function TrainingPage() {
  const user = await requireUser("/trenins");
  const [course, access, due, mistakes] = await Promise.all([getCourseOverview(), hasFullAccess(user.id), getDueReviewIds(user.id), getMistakesByTopic(user.id)]);
  const modules: BuilderModule[] = course.modules.map((m) => ({
    id: m.id,
    order: m.order,
    title: m.titleLv,
    locked: !access && !isFreeModule(m.id),
    topics: m.topics.map((t) => ({ id: t.id, title: t.titleLv, questions: t.questionCount, mistakes: mistakes.get(t.id) ?? 0 })),
  }));

  return (
    <div className="page-white mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Trenēties</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Izvēlies tēmas un sāc treniņu. Pēc katras atbildes redzēsi skaidrojumu ar atsauci uz likumu.</p>

      {due.length > 0 && (
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border-2 border-accent bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Šodien jāatkārto {plural(due.length, "jautājums", "jautājumi")}</p>
            <p className="mt-1 text-sm text-muted">Kļūdains jautājums atgriežas pēc 1, 3 un 7 dienām, līdz trīs reizes pēc kārtas atbildi pareizi.</p>
          </div>
          <Link href="/trenins/sakt?atkartot=1" className="btn-primary shrink-0 gap-2">
            <RotateCcw aria-hidden="true" className="size-4" /> Atkārtot
          </Link>
        </div>
      )}

      <div className="mt-10">
        <TrainingBuilder modules={modules} />
      </div>
    </div>
  );
}
