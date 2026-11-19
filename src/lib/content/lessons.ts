/**
 * Tēmu nodarbības (content/lessons/<tēma>.md, piem. 4-2.md).
 *
 * Faila sākumā galvene:
 *   ---
 *   title: Vecuma prasības
 *   minutes: 4
 *   sources: Ieroču aprites likums, 14. pants; MK noteikumi Nr. 210, 22. punkts
 *   ---
 * Teksts — vienkāršs markdown: "## virsraksts", rindkopas, "- saraksts", "> Atceries" bloks, **treknraksts**.
 * Atsauces tekstā iekavās; bez akta nosaukuma — attiecas uz pirmo galvenē minēto aktu.
 * Tehniskajās tēmās avots var būt "Kvalifikācijas pārbaudījuma jautājumi Nr. …" (data/questions.json oficiālās atbildes).
 * Visi juridiskie fakti — tikai no content/law (atsauces pārbauda validateLessons).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { lawArticleIndex, parseLawReference } from "./explanations";

const LESSON_DIR = path.join(process.cwd(), "content", "lessons");

export interface Lesson {
  topicId: string;
  title: string;
  minutes: number;
  sources: string;
  body: string;
}

export function parseLesson(topicId: string, raw: string): Lesson {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Nodarbībai ${topicId} nav galvenes`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return {
    topicId,
    title: meta.title ?? "",
    minutes: Number(meta.minutes),
    sources: meta.sources ?? "",
    body: m[2].trim(),
  };
}

const fileFor = (topicId: string, dir: string) => path.join(dir, `${topicId.replace(".", "-")}.md`);

export function readLesson(topicId: string, dir = LESSON_DIR): Lesson | null {
  const f = fileFor(topicId, dir);
  return existsSync(f) ? parseLesson(topicId, readFileSync(f, "utf8")) : null;
}

export function listLessons(dir = LESSON_DIR): Lesson[] {
  return readdirSync(dir)
    .filter((f) => /^\d+-\d+\.md$/.test(f))
    .map((f) => parseLesson(f.slice(0, -3).replace("-", "."), readFileSync(path.join(dir, f), "utf8")));
}

/** Atsauces tekstā "(likums, N. pants)" un galvenē jāatbilst content/law tekstiem. */
export function validateLessons(topicIds: string[], dir = LESSON_DIR) {
  const problems: string[] = [];
  const index = lawArticleIndex();
  const known = new Set(topicIds);
  for (const l of listLessons(dir)) {
    const p = (msg: string) => problems.push(`Nodarbība ${l.topicId}: ${msg}`);
    if (!known.has(l.topicId)) p("tēma neeksistē");
    if (!l.title) p("nav virsraksta");
    if (!(l.minutes >= 2 && l.minutes <= 8)) p(`ilgums ${l.minutes} min (jābūt 2–8)`);
    if (/TODO/.test(l.body)) p("tekstā palicis TODO");
    const words = l.body.split(/\s+/).length;
    if (words < 120 || words > 1100) p(`${words} vārdi (jābūt 120–1100)`);
    const refs = parseLawReference(l.sources);
    // tehniskajām tēmām (ieroča uzbūve, drošība) avots var būt oficiālie pārbaudījuma jautājumi
    if (!refs.length && !/pārbaudījuma jautājumi Nr\./.test(l.sources)) p("galvenē nav atpazītu avotu");
    for (const r of refs) if (!index[r.law]?.has(r.article)) p(`avots ${r.law} ${r.article} nav content/law tekstā`);
    // atsauce bez akta nosaukuma, piem. "(13. pants)", attiecas uz pirmo galvenē minēto aktu
    const defaultAct = l.sources.split(",")[0];
    for (const [, inner] of l.body.matchAll(/\(([^()]*(?:pant|punkt)[^()]*)\)/g)) {
      const named = /Ieroču aprites likum|Krimināllikum|noteikum/.test(inner);
      for (const r of parseLawReference(named ? inner : `${defaultAct}, ${inner}`))
        if (!index[r.law]?.has(r.article)) p(`atsauce tekstā uz ${r.law} ${r.article} nav content/law tekstā`);
    }
  }
  return problems;
}
