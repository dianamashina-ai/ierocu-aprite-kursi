/**
 * Skaidrojumu melnraksti (content/explanations/M*.json).
 *
 * Katrs ieraksts: { id, explanation | null, law_reference | null, todo?, possibly_outdated?, outdated_note? }.
 * explanation = null nozīmē, ka skaidrojumu nevar uzrakstīt pēc pieejamajiem tiesību aktiem
 * (todo paskaidro, kāds avots vajadzīgs).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Content } from "./source";

const EntrySchema = z.object({
  id: z.number().int().positive(),
  explanation: z.string().min(20).nullable(),
  law_reference: z.string().min(5).nullable(),
  todo: z.string().optional(),
  possibly_outdated: z.boolean().optional(),
  outdated_note: z.string().nullable().optional(),
});

export type ExplanationEntry = z.infer<typeof EntrySchema>;

const EXPL_DIR = path.join(process.cwd(), "content", "explanations");
const LAW_DIR = path.join(process.cwd(), "content", "law");

export function readExplanations(dir = EXPL_DIR) {
  const out = new Map<number, ExplanationEntry & { file: string }>();
  const dupes: number[] = [];
  for (const f of readdirSync(dir).filter((x) => /^M\d\.json$/.test(x)).sort()) {
    const entries = z.array(EntrySchema).parse(JSON.parse(readFileSync(path.join(dir, f), "utf8")));
    for (const e of entries) {
      if (out.has(e.id)) dupes.push(e.id);
      out.set(e.id, { ...e, file: f });
    }
  }
  return { entries: out, dupes };
}

/** Pantu numuri, kas eksistē lejupielādētajos likumu tekstos. */
export function lawArticleIndex(dir = LAW_DIR) {
  const read = (f: string) => readFileSync(path.join(dir, f), "utf8");
  const collect = (text: string, stopAt?: string) => {
    const body = stopAt && text.includes(stopAt) ? text.slice(0, text.indexOf(stopAt)) : text;
    return new Set([...body.matchAll(/^### (\d+)\.(\^\d+)? ?pants/gm)].map((m) => m[1] + (m[2] ? `.${m[2]}` : "")));
  };
  return {
    ial: collect(read("ieroču-aprites-likums.md"), "## Pārejas noteikumi"),
    kl: collect(read("krimināllikums-izvilkums.md")),
  };
}

/**
 * Izvelk no atsauces pantu numurus: "Ieroču aprites likums, 14. panta 3. daļa; Krimināllikums, 29. pants"
 * → [{law:"ial", article:"14"}, {law:"kl", article:"29"}]. Diapazoniem ("28.–32. pants") ņem abus galus.
 */
export function parseLawReference(ref: string) {
  const out: { law: "ial" | "kl"; article: string }[] = [];
  let law: "ial" | "kl" | null = null;
  for (const raw of ref.split(";")) {
    const seg = raw.trim();
    if (/Ieroču aprites likums/.test(seg)) law = "ial";
    else if (/Krimināllikums/.test(seg)) law = "kl";
    const idx = seg.search(/pant/);
    if (idx === -1 || !law) continue;
    const before = seg.slice(0, idx).replace(/^(Ieroču aprites likums|Krimināllikums),?/, "");
    for (const m of before.matchAll(/(\d+)\.(\^\d+)?/g)) out.push({ law, article: m[1] + (m[2] ? `.${m[2]}` : "") });
  }
  return out;
}

export function validateExplanations(content: Content) {
  const problems: string[] = [];
  const { entries, dupes } = readExplanations();
  const index = lawArticleIndex();
  const byId = new Map(content.questions.map((q) => [q.id, q]));

  for (const id of dupes) problems.push(`Q${id}: skaidrojums vairākos failos`);
  for (const q of content.questions) if (!entries.has(q.id)) problems.push(`Q${q.id}: nav ieraksta`);

  for (const [id, e] of entries) {
    const q = byId.get(id);
    if (!q) {
      problems.push(`Q${id}: neeksistējošs jautājums`);
      continue;
    }
    if (e.file !== `${q.moduleId}.json`) problems.push(`Q${id}: ir failā ${e.file}, bet jautājums ir ${q.moduleId}`);
    if (e.explanation && !e.law_reference) problems.push(`Q${id}: skaidrojums bez atsauces uz likumu`);
    if (!e.explanation && !e.todo) problems.push(`Q${id}: nav ne skaidrojuma, ne TODO`);
    if (e.possibly_outdated && !e.outdated_note) problems.push(`Q${id}: atzīme «iespējams, novecojis» bez paskaidrojuma`);
    if (e.explanation && /(pirm|otr|treš|ceturt|pēdēj)\w*\s+variant|variant\w*\s+[a-f]\b/i.test(e.explanation))
      problems.push(`Q${id}: skaidrojums atsaucas uz varianta vietu vai burtu (varianti tiek jaukti)`);
    if (e.law_reference) {
      const refs = parseLawReference(e.law_reference);
      if (!refs.length) problems.push(`Q${id}: atsaucē nav atpazīts neviens pants: "${e.law_reference}"`);
      for (const r of refs)
        if (!index[r.law].has(r.article))
          problems.push(`Q${id}: atsauce uz ${r.law === "ial" ? "IAL" : "KL"} ${r.article}. pantu, kura nav content/law tekstā`);
    }
  }
  return problems;
}
