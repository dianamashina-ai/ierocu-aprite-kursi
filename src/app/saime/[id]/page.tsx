import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule, moduleOfTopic, requireSignUpForFreeModule } from "@/lib/billing/access";
import { Paywall } from "@/components/billing/paywall";
import { loadFamilyComparison } from "@/lib/content/family";
import { FamilyComparison } from "@/components/compare/family-comparison";

export const dynamic = "force-dynamic";

export const metadata = { title: "Līdzīgie jautājumi" };

export default async function FamilyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ no?: string }>;
}) {
  const { id } = await params;
  const { no } = await searchParams;
  const familyId = /^\d{1,3}$/.test(id) ? Number(id) : null;
  const from = no && /^\d+$/.test(no) ? Number(no) : null;
  const data = familyId ? await loadFamilyComparison(familyId, from) : null;
  if (!data) notFound();
  const user = await getCurrentUser();
  requireSignUpForFreeModule(user?.id, moduleOfTopic(data.topicId), `/saime/${id}`);
  if (!(await canAccessModule(user?.id, moduleOfTopic(data.topicId)))) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <Paywall title="Līdzīgo jautājumu salīdzinājums pieejams ar pilnu piekļuvi" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Sākums" },
          ...(from ? [{ href: `/jautajums/${from}`, label: `Nr. ${from}` }] : []),
          { label: data.heading },
        ]}
      />
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{data.heading}</h1>
      <p className="mt-2 mb-6 max-w-2xl text-muted">{data.lead}</p>
      <FamilyComparison view={data.view} sharedText={data.sharedText} from={from} labels={data.labels} />
    </div>
  );
}
