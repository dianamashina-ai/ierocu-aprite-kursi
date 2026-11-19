import { describe, expect, it } from "vitest";
import { nextReviewState } from "@/lib/progress/review";
import { currentStreak, rigaDay } from "@/lib/progress/streak";
import { allocateBySection, sampleExam } from "@/lib/exam/sample";
import { readiness } from "@/lib/progress/readiness";
import { loadContent } from "@/lib/content/source";

const DAY = 86_400_000;
const t0 = new Date("2026-11-19T10:00:00Z");
const at = (days: number) => new Date(t0.getTime() + days * DAY);

describe("intervālu atkārtošana 1 / 3 / 7 dienas", () => {
  it("kļūda → atkārtot pēc 1 dienas", () => {
    expect(nextReviewState(null, false, t0)).toEqual({ reviewStage: 1, nextReviewAt: at(1) });
  });
  it("pilns cikls: 1 → 3 → 7 → apgūts", () => {
    let s = nextReviewState(null, false, t0);
    s = nextReviewState(s, true, at(1));
    expect(s).toEqual({ reviewStage: 2, nextReviewAt: at(4) });
    s = nextReviewState(s, true, at(4));
    expect(s).toEqual({ reviewStage: 3, nextReviewAt: at(11) });
    s = nextReviewState(s, true, at(11));
    expect(s).toEqual({ reviewStage: 0, nextReviewAt: null });
  });
  it("pareiza atbilde pirms termiņa grafiku nemaina", () => {
    const s = nextReviewState(null, false, t0);
    expect(nextReviewState(s, true, at(0.5))).toEqual(s);
  });
  it("kļūda jebkurā posmā sāk no jauna", () => {
    let s = nextReviewState(null, false, t0);
    s = nextReviewState(s, true, at(1));
    expect(nextReviewState(s, false, at(2))).toEqual({ reviewStage: 1, nextReviewAt: at(3) });
  });
  it("pareiza atbilde jaunam jautājumam — nav jāatkārto", () => {
    expect(nextReviewState(null, true, t0)).toEqual({ reviewStage: 0, nextReviewAt: null });
  });
});

describe("dienu sērija", () => {
  it("skaita secīgas dienas līdz šodienai vai vakardienai", () => {
    expect(currentStreak(["2026-11-17", "2026-11-18", "2026-11-19"], "2026-11-19")).toBe(3);
    expect(currentStreak(["2026-11-17", "2026-11-18"], "2026-11-19")).toBe(2);
    expect(currentStreak(["2026-11-16", "2026-11-18"], "2026-11-19")).toBe(1);
    expect(currentStreak(["2026-11-10"], "2026-11-19")).toBe(0);
    expect(currentStreak(["2026-02-28", "2026-03-01"], "2026-03-01")).toBe(2);
  });
  it("Rīgas laika josla", () => {
    expect(rigaDay(new Date("2026-11-19T22:30:00Z"))).toBe("2026-11-20");
  });
});

describe("izmēģinājuma eksāmena izlase", () => {
  const content = loadContent();
  const sizes: Record<string, number> = {};
  for (const q of content.questions) sizes[q.officialSectionId] = (sizes[q.officialSectionId] ?? 0) + 1;

  it("30 jautājumi proporcionāli sadaļām", () => {
    const a = allocateBySection(sizes, 30);
    expect(Object.values(a).reduce((x, y) => x + y, 0)).toBe(30);
    // IV ir lielākā sadaļa (137 no 515 → ~8)
    expect(a.IV).toBe(8);
    for (const [k, v] of Object.entries(a)) expect(Math.abs(v - (sizes[k] / 515) * 30)).toBeLessThan(1);
  });
  it("dažādiem izmēriem summa vienmēr precīza", () => {
    for (const n of [1, 10, 20, 40, 100, 515]) {
      expect(Object.values(allocateBySection(sizes, n)).reduce((x, y) => x + y, 0)).toBe(n);
    }
  });
  it("izlase: unikāli jautājumi, atkārtojama pēc sēklas", () => {
    const qs = content.questions.map((q) => ({ id: q.id, officialSectionId: q.officialSectionId }));
    const a = sampleExam(qs, 30, "s1");
    expect(new Set(a).size).toBe(30);
    expect(sampleExam(qs, 30, "s1")).toEqual(a);
    expect(sampleExam(qs, 30, "s2")).not.toEqual(a);
  });
});

describe("gatavība eksāmenam", () => {
  const topics = [{ topicId: "1.1", percent: 85 }, { topicId: "1.2", percent: 90 }];
  it("gatavs: 3 nokārtoti + visas tēmas ≥ 80 %", () => {
    expect(readiness({ recentExams: [{ passed: true }, { passed: true }, { passed: true }], topicPercents: topics }).ready).toBe(true);
  });
  it("nav gatavs: viens no pēdējiem 3 nav nokārtots", () => {
    expect(readiness({ recentExams: [{ passed: true }, { passed: false }, { passed: true }, { passed: true }], topicPercents: topics }).ready).toBe(false);
  });
  it("nav gatavs: mazāk par 3 eksāmeniem vai vāja tēma", () => {
    expect(readiness({ recentExams: [{ passed: true }, { passed: true }], topicPercents: topics }).ready).toBe(false);
    const r = readiness({ recentExams: [{ passed: true }, { passed: true }, { passed: true }], topicPercents: [...topics, { topicId: "2.1", percent: 79 }] });
    expect(r.ready).toBe(false);
    expect(r.topicsBelow).toEqual(["2.1"]);
  });
});
