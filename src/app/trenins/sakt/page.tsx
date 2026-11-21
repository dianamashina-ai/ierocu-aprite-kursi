import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getPracticeQuestionsByIds } from "@/lib/content/queries";
import { hasFullAccess, isFreeModule, moduleOfTopic } from "@/lib/billing/access";
import { getDueReviewIds } from "@/lib/progress/service";
import { buildTraining, parseTrainingParams } from "@/lib/training/service";
import { Practice } from "@/components/practice/practice";

export const dynamic = "force-dynamic";
export const metadata = { title: "Treniņš" };

export default async function TrainingRunPage({
  searchParams,
}: {
  searchParams: Promise<{ moduli?: string; kludas?: string; skaits?: string; atkartot?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser("/trenins");
  const review = sp.atkartot === "1";
  const ids = review ? await getDueReviewIds(user.id) : await buildTraining(user.id, parseTrainingParams(sp));
  const access = await hasFullAccess(user.id);
  const byId = new Map((await getPracticeQuestionsByIds(ids)).map((q) => [q.id, q]));
  // saglabājam secību (kļūdainākie vispirms) un piekļuves ierobežojumu
  const qs = ids.map((id) => byId.get(id)).filter((q): q is NonNullable<typeof q> => Boolean(q) && (access || isFreeModule(moduleOfTopic(q!.topicId))));

  return (
    <div className="page-white mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {qs.length > 0 ? (
        <Practice exitHref="/trenins" questions={qs} seed={randomUUID()} signedIn mode={review ? "review" : "practice"} shuffleQuestions={!sp.kludas} />
      ) : (
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="text-2xl font-semibold">{review ? "Šodien nekas nav jāatkārto" : "Jautājumu nav"}</h1>
          <p className="mt-2 text-muted">{review ? "Lieliski! Vari trenēties izvēlētajos moduļos." : "Izvēlētajos moduļos nav atbilstošu jautājumu."}</p>
          <Link href="/trenins" className="btn-primary mt-6">Uz treniņa izvēli</Link>
        </div>
      )}
    </div>
  );
}
