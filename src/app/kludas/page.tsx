import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDueReviewIds, getUpcomingReviews, getWrongIds } from "@/lib/progress/service";
import { getPracticeQuestionsByIds } from "@/lib/content/queries";
import { Practice } from "@/components/practice/practice";
import { formatDay, plural } from "@/lib/format";
import { hasFullAccess, isFreeModule, moduleOfTopic } from "@/lib/billing/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kļūdu labošana" };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ visas?: string }> }) {
  const user = await requireUser("/kludas");
  const all = (await searchParams).visas === "1";
  const [due, wrong, upcoming] = await Promise.all([getDueReviewIds(user.id), getWrongIds(user.id), getUpcomingReviews(user.id)]);
  const ids = all ? wrong : due;
  const access = await hasFullAccess(user.id);
  const qs = (await getPracticeQuestionsByIds(ids)).filter((q) => access || isFreeModule(moduleOfTopic(q.topicId)));

  return (
    <div className="page-white mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-semibold">{all ? "Visas kļūdas" : "Kļūdu labošana"}</h1>
      <p className="mt-2 text-muted">
        {all
          ? "Jautājumi, uz kuriem pēdējā atbilde bija nepareiza."
          : "Kļūdains jautājums atgriežas pēc 1, 3 un 7 dienām. Kad trīs reizes pēc kārtas atbildi pareizi, tas skaitās apgūts."}
      </p>

      {qs.length > 0 ? (
        <div className="mt-6">
          <Practice questions={qs} seed={randomUUID()} signedIn mode={all ? "practice" : "review"} />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="text-lg font-semibold">{all ? "Kļūdu nav." : "Šodien nekas nav jāatkārto."}</p>
            {upcoming.length > 0 && (
              <>
                <p className="mt-3 text-sm text-muted">Nākamās atkārtošanas:</p>
                <ul className="mt-2 space-y-1">
                  {upcoming.slice(0, 7).map((u) => (
                    <li key={u.day} className="flex justify-between gap-3 text-sm">
                      <span className="first-letter:uppercase">{formatDay(u.day)}</span>
                      <span className="tabular-nums text-muted">{plural(u.count, "jautājums", "jautājumi")}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {!all && wrong.length > 0 && <Link href="/kludas?visas=1" className="btn-primary">Trenēt visas kļūdas ({wrong.length})</Link>}
            <Link href="/panelis" className="btn-secondary">Uz paneli</Link>
          </div>
        </div>
      )}
    </div>
  );
}
