import { describe, expect, it } from "vitest";
import { buildFamilyComparison, diffWords, similarity } from "@/lib/quiz/diff";
import { loadContent } from "@/lib/content/source";

const changed = (a: string, b: string) => diffWords(a, b).filter((t) => t.changed).map((t) => t.text.trim());

describe("diffWords", () => {
  it("atzīmē tikai atšķirīgos vārdus", () => {
    expect(changed("kalibrs nav lielāks par 9 milimetriem", "kalibrs nav lielāks par 11,43 milimetriem")).toEqual(["9"]);
    expect(changed("tas pats teksts", "tas pats teksts")).toEqual([]);
  });
  it("neņem vērā pieturzīmes un reģistru", () => {
    expect(changed("Teksts, ar komatu", "teksts ar komatu")).toEqual([]);
  });
  it("similarity 0..1", () => {
    expect(similarity("a b c", "a b c")).toBe(1);
    expect(similarity("a b c", "x y z")).toBe(0);
  });
});

describe("buildFamilyComparison", () => {
  const content = loadContent();
  const families = new Map<number, typeof content.questions>();
  for (const q of content.questions) if (q.familyId) families.set(q.familyId, [...(families.get(q.familyId) ?? []), q]);

  it("strādā visām 83 saimēm; katram jautājumam viena pareizā atbilde", () => {
    expect(families.size).toBe(83);
    for (const qs of families.values()) {
      const view = buildFamilyComparison(qs.map((q) => ({ ...q, correctKey: q.correctKey })));
      expect(view).toHaveLength(qs.length);
      for (const v of view) expect(v.options.filter((o) => o.isCorrect)).toHaveLength(1);
    }
  });

  it("kombinācijas netiek uzskatītas par vienādām starp jautājumiem", () => {
    const view = buildFamilyComparison(families.get(54)!);
    const meta = view.flatMap((v) => v.options.filter((o) => o.isMeta));
    expect(meta.length).toBeGreaterThan(0);
    expect(meta.every((o) => o.sharedWith.length === 0 && o.tokens === null)).toBe(true);
    expect(meta.find((o) => o.text === "b un c variants")?.refersTo).toEqual(["b", "c"]);
  });

  it("Q58 formulējums atšķiras (21 gads, nevis 18)", () => {
    const v = buildFamilyComparison(families.get(54)!).find((x) => x.id === 58)!;
    expect(v.textTokens?.filter((t) => t.changed).map((t) => t.text.trim())).toContain("21");
  });
});
