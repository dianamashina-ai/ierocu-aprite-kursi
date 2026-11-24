/**
 * Sēklošanas loģika — atsevišķi no CLI skripta, lai to varētu testēt.
 * Esošos jautājumus pārraksta tikai ar reset=true; skaidrojumi, statusi un karogi
 * (ko rediģē administrācijā) netiek aiztikti nekad.
 */
import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { DEFAULT_CONTENT_VERSION, DEFAULT_EXAM_CONFIG } from "@/config/exam";
import type { Content } from "./source";
import { analyzeOptions } from "@/lib/quiz/shuffle";

export async function seedDatabase(
  db: PostgresJsDatabase<typeof schema>,
  content: Content,
  {
    reset = false,
    explanations,
  }: {
    reset?: boolean;
    /** Skaidrojumu melnraksti; tiek ierakstīti tikai jautājumiem ar statusu "draft" */
    explanations?: Map<number, { explanation: string | null; law_reference: string | null; possibly_outdated?: boolean; outdated_note?: string | null; reviewed?: boolean }>;
  } = {},
) {
  const { officialSections, modules, topics, questions, questionOptions, appSettings } = schema;
  let result = { inserted: 0, updated: 0, explained: 0 };


  await db.transaction(async (tx) => {
    for (const s of content.officialSections) {
      await tx
        .insert(officialSections)
        .values(s)
        .onConflictDoUpdate({ target: officialSections.id, set: { order: s.order, title: s.title } });
    }
    for (const m of content.modules) {
      await tx
        .insert(modules)
        .values(m)
        .onConflictDoUpdate({
          target: modules.id,
          set: { order: m.order, titleLv: m.titleLv },
        });
    }
    for (const t of content.topics) {
      const row = {
        id: t.id,
        moduleId: t.moduleId,
        order: t.order,
        titleLv: t.titleLv,
        lawHint: t.lawHint,
      };
      await tx.insert(topics).values(row).onConflictDoUpdate({
        target: topics.id,
        set: { moduleId: row.moduleId, order: row.order, titleLv: row.titleLv },
      });
    }

    let inserted = 0;
    let updated = 0;
    for (const q of content.questions) {
      const base = {
        id: q.id,
        topicId: q.topicId,
        officialSectionId: q.officialSectionId,
        text: q.text,
        correctKey: q.correctKey,
        sourcePage: q.sourcePage,
        familyId: q.familyId,
        correctionNote: q.correctionNote,
        // Aprēķināts no variantu tekstiem; ja nevar droši parsēt — nejaucam un atzīmējam administrācijai
        ...(() => {
          const a = analyzeOptions(q.options);
          return { shuffleDisabled: !a.shuffleable, shuffleNote: a.reason };
        })(),
      };
      const opts = q.options.map((o) => ({
        questionId: q.id,
        key: o.key,
        position: o.position,
        text: o.text,
        printedLabel: o.printedLabel,
      }));

      const res = await tx
        .insert(questions)
        .values(base)
        .onConflictDoNothing({ target: questions.id })
        .returning({ id: questions.id });

      if (res.length) {
        await tx.insert(questionOptions).values(opts);
        inserted++;
      } else if (reset) {
        await tx
          .update(questions)
          .set({ ...base, updatedAt: new Date() })
          .where(sql`${questions.id} = ${q.id}`);
        await tx.delete(questionOptions).where(sql`${questionOptions.questionId} = ${q.id}`);
        await tx.insert(questionOptions).values(opts);
        updated++;
      }
    }

    await tx
      .insert(appSettings)
      .values([
        { key: "exam", value: DEFAULT_EXAM_CONFIG },
        { key: "content_version", value: DEFAULT_CONTENT_VERSION },
      ])
      .onConflictDoNothing();

    let explained = 0;
    if (explanations) {
      for (const [id, e] of explanations) {
        const r = await tx
          .update(questions)
          .set({
            explanation: e.explanation,
            lawReference: e.law_reference,
            possiblyOutdated: Boolean(e.possibly_outdated),
            outdatedNote: e.outdated_note ?? null,
            ...(e.reviewed ? { explanationStatus: "reviewed" as const } : {}),
          })
          .where(and(eq(questions.id, id), eq(questions.explanationStatus, "draft")))
          .returning({ id: questions.id });
        explained += r.length;
      }
    }
    result = { inserted, updated, explained };
  });

  return result;
}
