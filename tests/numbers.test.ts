import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/source";
import { readNumbers, validateNumbers } from "@/lib/content/numbers";

describe("skaitļu kartītes", () => {
  it("katrai kartītei ir esoša tēma un avots content/law tekstā", () => {
    expect(validateNumbers(loadContent().topics.map((t) => t.id))).toEqual([]);
  });
  it("kartīšu ir pietiekami", () => {
    expect(readNumbers().length).toBeGreaterThanOrEqual(30);
  });
});
