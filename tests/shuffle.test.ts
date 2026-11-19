import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/source";
import {
  analyzeOptions,
  extractLetterRefs,
  isMetaOption,
  KEYS,
  shuffleOptions,
  type QuizOption,
} from "@/lib/quiz/shuffle";

const content = loadContent();
const SEEDS = Array.from({ length: 40 }, (_, i) => `seed-${i}`);

/** Kombinācijas nozīme: oriģinālo burtu kopa katrā burtu grupā + teksts bez burtiem. */
function meaning(text: string, displayToOriginal: Map<string, string>) {
  const groups = extractLetterRefs(text).map((g) => g.map((l) => displayToOriginal.get(l) ?? `?${l}`).sort().join(""));
  const skeleton = text.replace(/[a-f](?:\s*,\s*[a-f])*\s+(?:un|vai)\s+[a-f](?=\s+(?:variant|apakšpunkt))/g, "#");
  return { groups, skeleton };
}

describe("shuffleOptions — visi 515 jautājumi", () => {
  it("katru jautājumu var droši parsēt (neviens nav atslēgts)", () => {
    const failed = content.questions
      .map((q) => ({ id: q.id, ...analyzeOptions(q.options) }))
      .filter((a) => !a.shuffleable);
    expect(failed).toEqual([]);
  });

  for (const q of content.questions) {
    it(`Q${q.id}: pēc jaukšanas pareizā atbilde pēc nozīmes nemainās`, () => {
      const identity = new Map(q.options.map((o) => [o.key, o.key]));
      const original = new Map(q.options.map((o) => [o.key, o]));
      const correctMeaning = meaning(original.get(q.correctKey)!.text, identity);

      for (const seed of SEEDS) {
        const shown = shuffleOptions(q.options, `${seed}:${q.id}`);
        const d2o = new Map(shown.map((o) => [o.displayKey, o.originalKey]));

        // burti a, b, c… pēc kārtas; tie paši varianti, katrs vienreiz
        expect(shown.map((o) => o.displayKey)).toEqual(KEYS.slice(0, q.options.length));
        expect(shown.map((o) => o.originalKey).sort()).toEqual(q.options.map((o) => o.key).sort());

        // meta varianti beigās, sākotnējā secībā
        const firstMeta = shown.findIndex((o) => o.isMeta);
        if (firstMeta !== -1) {
          expect(shown.slice(firstMeta).every((o) => o.isMeta)).toBe(true);
          const metaOrig = shown.filter((o) => o.isMeta).map((o) => o.originalKey);
          expect(metaOrig).toEqual([...metaOrig].sort());
        }

        // parasto variantu teksts nemainās; kombinācijām nozīme tā pati
        for (const o of shown) {
          const src = original.get(o.originalKey)!;
          if (!o.isMeta) expect(o.text).toBe(src.text);
          else expect(meaning(o.text, d2o)).toEqual(meaning(src.text, identity));
        }

        // pareizā atbilde: tieši viena, ar to pašu nozīmi
        const correct = shown.filter((o) => o.originalKey === q.correctKey);
        expect(correct).toHaveLength(1);
        expect(meaning(correct[0].text, d2o)).toEqual(correctMeaning);
      }
    });
  }

  it("deterministisks: tā pati sēkla → tā pati secība", () => {
    for (const q of content.questions.slice(0, 50)) {
      expect(shuffleOptions(q.options, "x")).toEqual(shuffleOptions(q.options, "x"));
    }
  });

  it("ja pareizā atbilde ir parasts variants, tās burts tiek sajaukts", () => {
    let total = 0;
    let samePlace = 0;
    let expected = 0;
    for (const q of content.questions) {
      const a = analyzeOptions(q.options);
      const ci = q.options.findIndex((o) => o.key === q.correctKey);
      if (a.meta[ci]) continue; // kombinācijas pēc noteikumiem paliek beigās
      const nRegular = a.meta.filter((m) => !m).length;
      for (const seed of SEEDS) {
        const shown = shuffleOptions(q.options, `${seed}:${q.id}`);
        total++;
        expected += 1 / nRegular;
        if (shown.find((o) => o.originalKey === q.correctKey)!.displayKey === q.correctKey) samePlace++;
      }
    }
    // Tuvu nejaušībai (1/n), ar nelielu pielaidi
    expect(Math.abs(samePlace - expected) / total).toBeLessThan(0.03);
  });
});

describe("parsēšanas gadījumi", () => {
  const opts = (...texts: string[]): QuizOption[] => texts.map((text, i) => ({ key: KEYS[i], text }));

  it("ieroču kategorijas (lielie burti) nav kombinācijas", () => {
    expect(isMetaOption("B un C kategorijas garstobra—gludstobra šaujamieročus")).toBe(false);
    expect(isMetaOption("visi A, B, C, D un F kategorijas ieroči")).toBe(false);
    expect(isMetaOption("administratīvā atbildība")).toBe(false);
  });

  it("atpazīst kombinācijas", () => {
    for (const t of [
      "a un b variants",
      "visas atbildes ir pareizas",
      "visas ir atbildes ir pareizas",
      "neviena atbilde nav pareiza",
      "visi norādītie dokumenti",
      "ieroci atļauts dot tikai a un b variantā noteiktajos gadījumos tajos noteiktajām personām",
    ])
      expect(isMetaOption(t), t).toBe(true);
  });

  it("pārraksta 'a un c' un 'a, b un c' un 'a vai b'", () => {
    const q = opts("x", "y", "z", "w", "a un c variants", "jāveic a vai b variantā norādītās darbības");
    for (const seed of SEEDS) {
      const shown = shuffleOptions(q, seed);
      const o2d = new Map(shown.map((o) => [o.originalKey, o.displayKey]));
      const [ac, ab] = shown.slice(4).map((o) => o.text);
      const exp1 = [o2d.get("a"), o2d.get("c")].sort();
      const exp2 = [o2d.get("a"), o2d.get("b")].sort();
      expect(ac).toBe(`${exp1[0]} un ${exp1[1]} variants`);
      expect(ab).toBe(`jāveic ${exp2[0]} vai ${exp2[1]} variantā norādītās darbības`);
    }
    const three = shuffleOptions(opts("x", "y", "z", "visas a, b un c variantā norādītās sastāvdaļas"), "s");
    expect(three[3].text).toBe("visas a, b un c variantā norādītās sastāvdaļas");
  });

  it("neparsējamu jautājumu nejauc", () => {
    const q = opts("x", "y", "a un d variants", "z"); // kombinācija nav beigās un atsaucas uz meta
    expect(analyzeOptions(q).shuffleable).toBe(false);
    expect(shuffleOptions(q, "s").map((o) => o.originalKey)).toEqual(["a", "b", "c", "d"]);
    const q2 = opts("x", "y", "z", "a un e variants"); // e neeksistē
    expect(analyzeOptions(q2).shuffleable).toBe(false);
  });

  it("disabled=true saglabā oriģinālo secību", () => {
    const q = content.questions.find((x) => x.id === 1)!;
    expect(shuffleOptions(q.options, "s", { disabled: true }).map((o) => o.originalKey)).toEqual(["a", "b", "c", "d"]);
  });
});
