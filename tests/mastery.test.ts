import { describe, expect, it } from "vitest";
import { nextMastery, type MasteryState } from "@/lib/progress/mastery";

const run = (seq: boolean[], start: MasteryState | null = null) => seq.reduce<MasteryState | null>((s, c) => nextMastery(s, c), start)!;

describe("nextMastery", () => {
  it("viena pareiza atbilde vēl nav apgūts", () => expect(run([true]).mastered).toBe(false));
  it("divas pareizas pēc kārtas — apgūts", () => expect(run([true, true]).mastered).toBe(true));
  it("pareiza, nepareiza, pareiza — vēl nav apgūts", () => expect(run([true, false, true]).mastered).toBe(false));
  it("3 pareizas un viena kļūda — joprojām apgūts", () => expect(run([true, true, true, false]).mastered).toBe(true));
  it("divas kļūdas pēc kārtas — vairs nav apgūts", () => expect(run([true, true, false, false]).mastered).toBe(false));
  it("kļūda, pareiza, kļūda — paliek apgūts", () => expect(run([true, true, false, true, false]).mastered).toBe(true));
  it("pēc zaudēšanas atkal vajag 2 pareizas", () => {
    const s = run([true, true, false, false, true]);
    expect(s.mastered).toBe(false);
    expect(nextMastery(s, true).mastered).toBe(true);
  });
});
