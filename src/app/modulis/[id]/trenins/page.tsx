import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { getModule, getPracticeQuestionsForModule } from "@/lib/content/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Practice } from "@/components/practice/practice";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/billing/access";
import { Paywall } from "@/components/billing/paywall";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const data = await getModule((await params).id);
  return { title: data ? `Treniņš: ${data.module.titleLv}` : undefined };
}

export default async function ModulePracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getModule(id);
  if (!data) notFound();
  const user = await getCurrentUser();
  const allowed = await canAccessModule(user?.id, id);
  const questions = allowed ? await getPracticeQuestionsForModule(id) : [];

  return (
    <div className="page-white mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ href: "/", label: "Mācību kurss" }, { href: `/modulis/${id}`, label: data.module.titleLv }, { label: "Treniņš" }]} />
      <div className="mt-5">
        {allowed ? (
          <Practice signedIn={Boolean(user)} questions={questions} seed={randomUUID()} topicHref={`/modulis/${id}`} />
        ) : (
          <Paywall />
        )}
      </div>
    </div>
  );
}
