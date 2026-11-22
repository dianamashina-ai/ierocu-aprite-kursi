import "server-only";
import { getTranslations } from "next-intl/server";
import { getFamily } from "@/lib/content/queries";
import { buildFamilyComparison } from "@/lib/quiz/diff";
import type { CompareLabels } from "@/components/compare/family-comparison";

/** Saimes salīdzinājuma dati (bez piekļuves pārbaudes — to dara izsaucējs). */
export async function loadFamilyComparison(familyId: number, from: number | null) {
  const qs = await getFamily(familyId);
  if (qs.length < 2) return null;
  const view = buildFamilyComparison(qs);
  // jautājums, no kura atnāca skolēns, — pirmais
  view.sort((a, b) => (a.id === from ? -1 : b.id === from ? 1 : a.id - b.id));
  const sharedText = qs.find((q) => view.find((v) => v.id === q.id && !v.textTokens))?.text ?? qs[0].text;
  const t = await getTranslations("compare");
  const labels: CompareLabels = {
    summaryHeading: t("summaryHeading"),
    textDiffers: t("textDiffers"),
    legendCorrect: t("legendCorrect"),
    legendUnique: t("legendUnique"),
    legendChanged: t("legendChanged"),
    openQuestion: t("openQuestion"),
    inQuestions: t.raw("inQuestions") as string,
  };
  return { topicId: qs[0].topicId, count: qs.length, view, sharedText, labels, heading: t("heading"), lead: t("lead", { count: qs.length }) };
}
