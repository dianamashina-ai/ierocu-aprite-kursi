/**
 * Ielādē data/questions.json, validē struktūru un piemēro data/corrections.json.
 * Rezultāts — normalizēts satura modelis, ko izmanto sēklošana (seed) un testi.
 *
 * Šis modulis nedrīkst būt atkarīgs no datubāzes vai Next.js.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const OptionSchema = z.object({ key: z.string().regex(/^[a-z]$/), text: z.string().min(1) });

const QuestionSchema = z.object({
  id: z.number().int().positive(),
  module: z.string(),
  topic: z.string(),
  official_section: z.string(),
  question: z.string().min(1),
  options: z.array(OptionSchema).min(2).max(6),
  correct: z.string(),
  source_page: z.number().int().positive(),
  similar_question_ids: z.array(z.number().int()),
  explanation: z.string().nullable(),
  law_reference: z.string().nullable(),
});

const TopicSchema = z.object({
  id: z.string(),
  title_lv: z.string(),
  title_ru: z.string(),
  question_ids: z.array(z.number().int()),
  count: z.number().int(),
  law_hint: z.string().nullable().optional(),
});

const ModuleSchema = z.object({
  id: z.string(),
  title_lv: z.string(),
  title_ru: z.string(),
  order: z.number().int(),
  topics: z.array(TopicSchema),
});

export const SourceSchema = z.object({
  meta: z.object({
    source: z.string(),
    source_pdf_date: z.string(),
    total_questions: z.number().int(),
    notes: z.array(z.string()),
  }).passthrough(),
  official_sections: z.array(z.object({ id: z.string(), title: z.string() })),
  modules: z.array(ModuleSchema),
  questions: z.array(QuestionSchema),
});

export type SourceData = z.infer<typeof SourceSchema>;

const CorrectionSchema = z.object({
  reason: z.string(),
  printed_labels: z.array(z.string()).optional(),
  options: z.array(z.string()).optional(),
  correct_position: z.number().int().positive(),
});

const CorrectionsSchema = z.object({
  questions: z.record(z.string(), CorrectionSchema),
});

export type Corrections = z.infer<typeof CorrectionsSchema>;

export const OPTION_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

export interface ContentOption {
  key: string; // normalizēts: a, b, c… pēc kārtas
  position: number; // 1..n
  text: string; // oficiālais teksts, nemainīts
  printedLabel: string; // burts, kas iespiests PDF (parasti = key)
}

export interface ContentQuestion {
  id: number;
  moduleId: string;
  topicId: string;
  officialSectionId: string;
  text: string;
  options: ContentOption[];
  correctKey: string;
  sourcePage: number;
  similarQuestionIds: number[];
  familyId: number | null; // mazākais jautājuma id saimē
  correctionNote: string | null;
}

export interface ContentTopic {
  id: string;
  moduleId: string;
  order: number;
  titleLv: string;
  titleRu: string;
  lawHint: string | null;
  questionIds: number[];
}

export interface ContentModule {
  id: string;
  order: number;
  titleLv: string;
  titleRu: string;
}

export interface Content {
  meta: SourceData["meta"];
  officialSections: { id: string; order: number; title: string }[];
  modules: ContentModule[];
  topics: ContentTopic[];
  questions: ContentQuestion[];
}

const DATA_DIR = path.join(process.cwd(), "data");

export function readSource(file = path.join(DATA_DIR, "questions.json")): SourceData {
  return SourceSchema.parse(JSON.parse(readFileSync(file, "utf8")));
}

export function readCorrections(file = path.join(DATA_DIR, "corrections.json")): Corrections {
  return CorrectionsSchema.parse(JSON.parse(readFileSync(file, "utf8")));
}

/** Saimes = savienotās komponentes grafā, ko veido similar_question_ids. */
export function computeFamilies(questions: { id: number; similar_question_ids: number[] }[]) {
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(Math.max(ra, rb), Math.min(ra, rb));
  };
  for (const q of questions) for (const s of q.similar_question_ids) union(q.id, s);

  const familyOf = new Map<number, number | null>();
  const sizes = new Map<number, number>();
  for (const q of questions) sizes.set(find(q.id), (sizes.get(find(q.id)) ?? 0) + 1);
  for (const q of questions) {
    const root = find(q.id);
    familyOf.set(q.id, (sizes.get(root) ?? 0) > 1 ? root : null);
  }
  return familyOf;
}

export function buildContent(source: SourceData, corrections: Corrections): Content {
  const families = computeFamilies(source.questions);

  const questions: ContentQuestion[] = source.questions.map((q) => {
    const fix = corrections.questions[String(q.id)];
    const texts = fix?.options ?? q.options.map((o) => o.text);
    const printed = fix?.printed_labels ?? q.options.map((o) => o.key);
    if (printed.length !== texts.length) {
      throw new Error(`Q${q.id}: printed_labels (${printed.length}) ≠ options (${texts.length})`);
    }

    const options: ContentOption[] = texts.map((text, i) => ({
      key: OPTION_KEYS[i],
      position: i + 1,
      text,
      printedLabel: printed[i],
    }));

    let correctKey: string;
    if (fix) {
      correctKey = OPTION_KEYS[fix.correct_position - 1];
    } else {
      // Bez labojuma: burtiem jābūt a, b, c… pēc kārtas, tad key = printedLabel.
      const keys = q.options.map((o) => o.key).join("");
      if (keys !== OPTION_KEYS.slice(0, q.options.length).join("")) {
        throw new Error(`Q${q.id}: neregulāri variantu burti "${keys}" bez labojuma corrections.json`);
      }
      correctKey = q.correct;
    }

    return {
      id: q.id,
      moduleId: q.module,
      topicId: q.topic,
      officialSectionId: q.official_section,
      text: q.question,
      options,
      correctKey,
      sourcePage: q.source_page,
      similarQuestionIds: [...q.similar_question_ids].sort((a, b) => a - b),
      familyId: families.get(q.id) ?? null,
      correctionNote: fix?.reason ?? null,
    };
  });

  return {
    meta: source.meta,
    officialSections: source.official_sections.map((s, i) => ({ id: s.id, order: i + 1, title: s.title })),
    modules: source.modules
      .map((m) => ({ id: m.id, order: m.order, titleLv: m.title_lv, titleRu: m.title_ru }))
      .sort((a, b) => a.order - b.order),
    topics: source.modules.flatMap((m) =>
      m.topics.map((t, i) => ({
        id: t.id,
        moduleId: m.id,
        order: i + 1,
        titleLv: t.title_lv,
        titleRu: t.title_ru,
        lawHint: t.law_hint ?? null,
        questionIds: t.question_ids,
      })),
    ),
    questions,
  };
}

export function loadContent(): Content {
  return buildContent(readSource(), readCorrections());
}
