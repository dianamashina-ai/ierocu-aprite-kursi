import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFamily } from "@/lib/content/queries";
import { buildFamilyComparison, type DiffToken } from "@/lib/quiz/diff";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule, moduleOfTopic } from "@/lib/billing/access";
import { Paywall } from "@/components/billing/paywall";

export const dynamic = "force-dynamic";

export const metadata = { title: "Līdzīgie jautājumi" };

function Tokens({ tokens }: { tokens: DiffToken[] }) {
  return (
    <>
      {tokens.map((t, i) =>
        t.changed ? (
          <mark key={i} className="rounded bg-warn-soft px-0.5 text-ink">
            {t.text}
          </mark>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </>
  );
}

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
  const qs = familyId ? await getFamily(familyId) : [];
  if (qs.length < 2) notFound();
  const user = await getCurrentUser();
  if (!(await canAccessModule(user?.id, moduleOfTopic(qs[0].topicId)))) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <Paywall title="Līdzīgo jautājumu salīdzinājums pieejams ar pilnu piekļuvi" />
      </div>
    );
  }
  const from = no && /^\d+$/.test(no) ? Number(no) : null;
  const t = await getTranslations("compare");

  const view = buildFamilyComparison(qs);
  // jautājums, no kura atnāca skolēns, — pirmais
  view.sort((a, b) => (a.id === from ? -1 : b.id === from ? 1 : a.id - b.id));
  const sharedText = qs.find((q) => view.find((v) => v.id === q.id && !v.textTokens))?.text ?? qs[0].text;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Sākums" },
          ...(from ? [{ href: `/jautajums/${from}`, label: `Nr. ${from}` }] : []),
          { label: t("heading") },
        ]}
      />
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{t("heading")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("lead", { count: qs.length })}</p>

      <blockquote className="mt-6 rounded-xl border-l-4 border-accent bg-white px-5 py-4 text-lg font-medium" lang="lv">
        {sharedText}
      </blockquote>

      <section className="mt-8" aria-labelledby="sum-h">
        <h2 id="sum-h" className="text-lg font-semibold">{t("summaryHeading")}</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-line">
              {view.map((q) => (
                <tr key={q.id} className={q.id === from ? "bg-accent-soft" : undefined}>
                  <th scope="row" className="w-20 px-4 py-3 align-top font-semibold tabular-nums">
                    <Link href={`/jautajums/${q.id}`} className="underline-offset-4 hover:underline">Nr. {q.id}</Link>
                  </th>
                  <td className="px-4 py-3 text-ok" lang="lv">{q.correctText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Apzīmējumi">
        <li className="flex items-center gap-2"><span className="size-4 rounded border-2 border-ok bg-ok-soft" aria-hidden="true" /> {t("legendCorrect")}</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded border-2 border-dashed border-accent" aria-hidden="true" /> {t("legendUnique")}</li>
        <li className="flex items-center gap-2"><mark className="rounded bg-warn-soft px-1 text-ink">vārdi</mark> {t("legendChanged")}</li>
      </ul>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {view.map((q) => (
          <article
            key={q.id}
            className={`rounded-2xl border bg-white p-5 ${q.id === from ? "border-accent ring-2 ring-accent-soft" : "border-line"}`}
            aria-labelledby={`fq-${q.id}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={`fq-${q.id}`} className="font-semibold">Nr. {q.id}</h2>
              <Link href={`/jautajums/${q.id}`} className="text-sm text-accent-strong underline-offset-4 hover:underline">
                {t("openQuestion")}
              </Link>
            </div>
            {q.textTokens && (
              <p className="mt-2 text-sm" lang="lv">
                <span className="font-medium text-warn">{t("textDiffers")}: </span>
                <Tokens tokens={q.textTokens} />
              </p>
            )}
            <ol className="mt-4 space-y-2">
              {q.options.map((o) => {
                const unique = !o.isMeta && o.sharedWith.length === 0;
                const tone = o.isCorrect
                  ? "border-ok bg-ok-soft"
                  : unique
                    ? "border-dashed border-accent"
                    : "border-line text-muted";
                const refTexts = o.refersTo?.map((k) => q.options.find((x) => x.key === k)?.text).filter(Boolean);
                return (
                  <li key={o.key} className={`flex gap-3 rounded-xl border-2 px-3 py-2.5 text-sm ${tone}`}>
                    <span className={`font-semibold ${o.isCorrect ? "text-ok" : "text-muted"}`}>{o.key}</span>
                    <span className="flex-1" lang="lv">
                      {o.tokens ? <Tokens tokens={o.tokens} /> : o.text}
                      {o.isCorrect && <span className="sr-only"> — {t("legendCorrect")}</span>}
                      {refTexts && refTexts.length > 0 && (
                        <span className="mt-1 block text-xs text-muted">
                          = {refTexts.map((txt) => `«${txt}»`).join(" + ")}
                        </span>
                      )}
                      {!o.isMeta && !unique && (
                        <span className="mt-1 block text-xs text-muted">{t("inQuestions", { ids: o.sharedWith.map((i) => `Nr. ${i}`).join(", ") })}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}
