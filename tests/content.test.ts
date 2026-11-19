import { describe, expect, it } from "vitest";
import { buildContent, computeFamilies, loadContent, readCorrections, readSource } from "@/lib/content/source";
import { EXPECTED_QUESTION_COUNT, validateContent } from "@/lib/content/validate";

const content = loadContent();

describe("satura integritāte (questions.json + corrections.json)", () => {
  it("nav validācijas problēmu", () => {
    expect(validateContent(content)).toEqual([]);
  });

  it("515 jautājumi ar numuriem 1..515", () => {
    expect(content.questions).toHaveLength(EXPECTED_QUESTION_COUNT);
    expect(content.questions.map((q) => q.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: EXPECTED_QUESTION_COUNT }, (_, i) => i + 1),
    );
  });

  it("katram jautājumam tieši viena pareizā atbilde, kas ir starp variantiem", () => {
    for (const q of content.questions) {
      expect(q.options.filter((o) => o.key === q.correctKey), `Q${q.id}`).toHaveLength(1);
    }
  });

  it("katrs jautājums tieši vienā tēmā, tēmu summa = 515", () => {
    const all = content.topics.flatMap((t) => t.questionIds);
    expect(all).toHaveLength(EXPECTED_QUESTION_COUNT);
    expect(new Set(all).size).toBe(EXPECTED_QUESTION_COUNT);
  });

  it("struktūra: 10 sadaļas, 9 moduļi, 37 tēmas (PROMPT.md min 33 — kļūda, datos ir 37)", () => {
    expect(content.officialSections).toHaveLength(10);
    expect(content.modules).toHaveLength(9);
    expect(content.topics).toHaveLength(37);
  });

  it("variantu skaits 2–6 (ne vienmēr 4)", () => {
    const counts = new Set(content.questions.map((q) => q.options.length));
    expect([...counts].every((n) => n >= 2 && n <= 6)).toBe(true);
    expect(counts.size).toBeGreaterThan(1);
  });

  it("83 saimes, kurās kopā 240 jautājumi", () => {
    const fam = new Map<number, number>();
    for (const q of content.questions) if (q.familyId) fam.set(q.familyId, (fam.get(q.familyId) ?? 0) + 1);
    expect(fam.size).toBe(83);
    expect([...fam.values()].reduce((a, b) => a + b, 0)).toBe(240);
    // saimes id = mazākais jautājuma numurs saimē
    for (const q of content.questions) if (q.familyId) expect(q.familyId).toBeLessThanOrEqual(q.id);
  });

  it("oficiālais teksts netiek mainīts (izņemot dokumentētus labojumus)", () => {
    const src = readSource();
    const corrected = new Set(Object.keys(readCorrections().questions).map(Number));
    const byId = new Map(content.questions.map((q) => [q.id, q]));
    for (const s of src.questions) {
      const q = byId.get(s.id)!;
      expect(q.text).toBe(s.question);
      if (!corrected.has(s.id)) {
        expect(q.options.map((o) => o.text)).toEqual(s.options.map((o) => o.text));
        expect(q.correctKey).toBe(s.correct);
      }
    }
  });
});

describe("corrections.json", () => {
  const byId = new Map(content.questions.map((q) => [q.id, q]));

  it("Q87: pareizs 2. variants", () => expect(byId.get(87)!.correctKey).toBe("b"));
  it("Q243: pareizs 4. variants 'visas atbildes ir pareizas'", () => {
    const q = byId.get(243)!;
    expect(q.correctKey).toBe("d");
    expect(q.options[3].text).toBe("visas atbildes ir pareizas");
    expect(q.options[3].printedLabel).toBe("a");
  });
  it("Q313: pareizs 1. variants", () => expect(byId.get(313)!.correctKey).toBe("a"));
  it("Q468: 4 varianti (e–h sadalīti), pareizs 'visas atbildes ir pareizas'", () => {
    const q = byId.get(468)!;
    expect(q.options).toHaveLength(4);
    expect(q.options.map((o) => o.printedLabel)).toEqual(["e", "f", "g", "h"]);
    expect(q.options[q.options.findIndex((o) => o.key === q.correctKey)].text).toBe("visas atbildes ir pareizas");
  });

  it("neregulāri burti bez labojuma izraisa kļūdu", () => {
    expect(() => buildContent(readSource(), { questions: {} })).toThrow(/neregulāri variantu burti/);
  });
});

describe("computeFamilies", () => {
  it("apvieno tranzitīvi un ignorē vientuļus jautājumus", () => {
    const f = computeFamilies([
      { id: 5, similar_question_ids: [9] },
      { id: 9, similar_question_ids: [5, 12] },
      { id: 12, similar_question_ids: [9] },
      { id: 20, similar_question_ids: [] },
    ]);
    expect([f.get(5), f.get(9), f.get(12), f.get(20)]).toEqual([5, 5, 5, null]);
  });
});
