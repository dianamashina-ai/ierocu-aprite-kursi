import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/source";
import { listLessons, parseLesson, validateLessons } from "@/lib/content/lessons";
import { parseBlocks } from "@/lib/content/lesson-markdown";

const content = loadContent();
const topicIds = content.topics.map((t) => t.id);

describe("nodarbības", () => {
  it("galvene, ilgums un atsauces atbilst content/law", () => {
    expect(validateLessons(topicIds)).toEqual([]);
  });

  it("vismaz viena nodarbība ir", () => {
    expect(listLessons().length).toBeGreaterThan(0);
  });

  it("galvenes parsēšana", () => {
    const l = parseLesson("4.2", "---\ntitle: X: Y\nminutes: 3\nsources: Ieroču aprites likums, 14. pants\n---\nTeksts");
    expect(l).toEqual({ topicId: "4.2", title: "X: Y", minutes: 3, sources: "Ieroču aprites likums, 14. pants", body: "Teksts" });
  });

  it("markdown bloki", () => {
    expect(parseBlocks("## A\nteksts\nturpinās\n\n- x\n- y\n\n> Atceries\n> - z")).toEqual([
      { kind: "h", text: "A" },
      { kind: "p", text: "teksts turpinās" },
      { kind: "ul", items: ["x", "y"] },
      { kind: "note", lines: ["Atceries", "- z"] },
    ]);
  });
});
