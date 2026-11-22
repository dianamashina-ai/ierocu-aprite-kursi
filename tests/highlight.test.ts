import { describe, expect, it } from "vitest";
import { highlightParts } from "@/lib/content/highlight";

describe("highlightParts", () => {
  it("izceļ vārdus pēc saknes, neatkarīgi no garumzīmēm un galotnes", () => {
    const p = highlightParts("Narkotisko, psihotropo vielu ietekmē", ["narkotis", "viel"]);
    expect(p.filter((x) => x.hit).map((x) => x.text)).toEqual(["Narkotisko", "vielu"]);
  });
  it("garumzīmes tekstā", () => {
    const p = highlightParts("nēsāšanas atļauja", ["nesas"]);
    expect(p.filter((x) => x.hit).map((x) => x.text)).toEqual(["nēsāšanas"]);
  });
  it("neizceļ vārda vidū", () => {
    expect(highlightParts("pārnēsājams", ["nesa"]).some((x) => x.hit)).toBe(false);
  });
});
