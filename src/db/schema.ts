/**
 * Datubāzes shēma (Drizzle + PostgreSQL).
 *
 * 1. posms: tikai saturs (moduļi, tēmas, jautājumi) un iestatījumi.
 * Lietotāju, progresa, maksājumu un administrēšanas tabulas tiks pievienotas
 * nākamajos posmos ar atsevišķām migrācijām.
 *
 * SVARĪGI: questions.id = jautājuma numurs oficiālajā PDF (1–515). Tas ir
 * pastāvīgs — uz to atsaucas skolēnu progress. Nekad neizmantot serial.
 */
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const explanationStatus = pgEnum("explanation_status", ["draft", "reviewed"]);

export const officialSections = pgTable("official_sections", {
  id: text("id").primaryKey(), // "I".."X"
  order: integer("order").notNull(),
  title: text("title").notNull(),
});

export const modules = pgTable("modules", {
  id: text("id").primaryKey(), // "M1".."M9"
  order: integer("order").notNull(),
  titleLv: text("title_lv").notNull(),
  titleRu: text("title_ru").notNull(),
});

export const topics = pgTable(
  "topics",
  {
    id: text("id").primaryKey(), // "4.2"
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id),
    order: integer("order").notNull(),
    titleLv: text("title_lv").notNull(),
    titleRu: text("title_ru").notNull(),
    lawHint: text("law_hint"),
    possiblyOutdated: boolean("possibly_outdated").notNull().default(false),
    outdatedNote: text("outdated_note"),
  },
  (t) => [index("topics_module_idx").on(t.moduleId)],
);

export const questions = pgTable(
  "questions",
  {
    id: integer("id").primaryKey(), // oficiālais numurs, NAV serial
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    officialSectionId: text("official_section_id")
      .notNull()
      .references(() => officialSections.id),
    text: text("text").notNull(), // oficiālais teksts, netiek labots
    correctKey: text("correct_key").notNull(),
    sourcePage: integer("source_page").notNull(),
    familyId: integer("family_id"), // mazākais jautājuma id saimē; null = nav saimes
    // Saturs, ko aizpilda 4. posmā / administrācijā
    explanationLv: text("explanation_lv"),
    explanationRu: text("explanation_ru"),
    explanationStatus: explanationStatus("explanation_status").notNull().default("draft"),
    lawReference: text("law_reference"),
    possiblyOutdated: boolean("possibly_outdated").notNull().default(false),
    outdatedNote: text("outdated_note"),
    // Variantu jaukšana (2. posms): true, ja variantus nevar droši parsēt
    shuffleDisabled: boolean("shuffle_disabled").notNull().default(false),
    shuffleNote: text("shuffle_note"),
    // Labojums, kas piemērots no data/corrections.json
    correctionNote: text("correction_note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("questions_topic_idx").on(t.topicId),
    index("questions_section_idx").on(t.officialSectionId),
    index("questions_family_idx").on(t.familyId),
    check("questions_id_range", sql`${t.id} > 0`),
  ],
);

export const questionOptions = pgTable(
  "question_options",
  {
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // a..f, normalizēts pēc kārtas
    position: integer("position").notNull(), // 1..6
    text: text("text").notNull(),
    printedLabel: text("printed_label").notNull(), // burts, kas iespiests PDF
  },
  (t) => [
    primaryKey({ columns: [t.questionId, t.key] }),
    check("question_options_key", sql`${t.key} ~ '^[a-f]$'`),
    check("question_options_position", sql`${t.position} between 1 and 6`),
  ],
);

/** Vienkārši atslēgas–vērtības iestatījumi (eksāmena formāts, satura versija u. c.). */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
