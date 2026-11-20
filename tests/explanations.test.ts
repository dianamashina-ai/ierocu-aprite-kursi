import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/source";
import { lawArticleIndex, parseLawReference, parseQuestionRefs, readExplanations, validateExplanations } from "@/lib/content/explanations";

const content = loadContent();

describe("skaidrojumu melnraksti", () => {
  it("katram jautājumam tieši viens ieraksts; atsauces uz pantiem, kas eksistē likuma tekstā", () => {
    expect(validateExplanations(content)).toEqual([]);
  });

  it("atsauču parsēšana", () => {
    expect(parseLawReference("Ieroču aprites likums, 14. panta 3. daļas 1. punkts; Krimināllikums, 28.–32. pants")).toEqual([
      { law: "ial", article: "14" },
      { law: "kl", article: "28" },
      { law: "kl", article: "32" },
    ]);
    expect(parseLawReference("Krimināllikums, 233.^1, 236., 237. pants")).toEqual([
      { law: "kl", article: "233.^1" },
      { law: "kl", article: "236" },
      { law: "kl", article: "237" },
    ]);
    expect(parseLawReference("Ieroču aprites likums, 1. panta 2. punkts")).toEqual([{ law: "ial", article: "1" }]);
    expect(parseQuestionRefs("MK noteikumi Nr. 494, 35. punkts; Kvalifikācijas pārbaudījuma jautājumi Nr. 428–430, 497 (oficiālās atbildes)")).toEqual([428, 429, 430, 497]);
    expect(parseLawReference("MK noteikumi Nr. 210, 15. un 21.^1 punkts")).toEqual([
      { law: "mk210", article: "15" },
      { law: "mk210", article: "21.^1" },
    ]);
  });

  it("pantu indekss nolasa abus likumus", () => {
    const idx = lawArticleIndex();
    expect(idx.ial.has("14")).toBe(true);
    expect(idx.ial.has("3.^1")).toBe(true);
    expect(idx.kl.has("29")).toBe(true);
    expect(idx.kl.has("233.^1")).toBe(true);
    expect(idx.kl.has("100")).toBe(false);
    expect(idx.mk210.has("21.^1")).toBe(true);
    expect(idx.mk191.has("18")).toBe(true);
  });

  it("statistika (informatīvi)", () => {
    const { entries } = readExplanations();
    const withText = [...entries.values()].filter((e) => e.explanation).length;
    expect(entries.size).toBe(515);
    expect(withText).toBeGreaterThan(350);
  });
});
