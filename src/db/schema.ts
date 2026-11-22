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
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
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
    explanation: text("explanation"),
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

// ─────────────────────────────────────────────────────────────
// 3. posms: lietotāji (better-auth) un progress
// ─────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const answerMode = pgEnum("answer_mode", ["practice", "review", "exam"]);

/** Katra atbilde (vēsture). Atbilde glabājas pēc ORIĢINĀLĀ burta — nav atkarīga no jaukšanas. */
export const answers = pgTable(
  "answers",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id),
    selectedKey: text("selected_key").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    mode: answerMode("mode").notNull(),
    examAttemptId: text("exam_attempt_id"),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("answers_user_time_idx").on(t.userId, t.answeredAt),
    index("answers_user_question_idx").on(t.userId, t.questionId),
  ],
);

/**
 * Kopsavilkums par lietotāja un jautājuma pāri + intervālu atkārtošana.
 * review_stage: 0 = nav atkārtojams, 1/2/3 = kļūda jāatkārto pēc 1/3/7 dienām.
 */
export const questionProgress = pgTable(
  "question_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id),
    attempts: integer("attempts").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    lastCorrect: boolean("last_correct").notNull(),
    /** apgūts: 2 pareizas pēc kārtas; zūd tikai pēc 2 nepareizām pēc kārtas (sk. lib/progress/mastery.ts) */
    mastered: boolean("mastered").notNull().default(false),
    /** >0 pareizas pēc kārtas, <0 nepareizas pēc kārtas */
    streak: integer("streak").notNull().default(0),
    lastAnsweredAt: timestamp("last_answered_at", { withTimezone: true }).notNull(),
    reviewStage: integer("review_stage").notNull().default(0),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.questionId] }),
    index("qp_user_review_idx").on(t.userId, t.nextReviewAt),
  ],
);

export const examStatus = pgEnum("exam_status", ["in_progress", "finished"]);

export const examAttempts = pgTable(
  "exam_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: examStatus("status").notNull().default("in_progress"),
    questionIds: jsonb("question_ids").$type<number[]>().notNull(),
    /** jautājuma id → izvēlētais oriģinālais burts */
    selected: jsonb("selected").$type<Record<string, string>>().notNull().default({}),
    seed: text("seed").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    passPercent: integer("pass_percent").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    correctCount: integer("correct_count"),
    passed: boolean("passed"),
  },
  (t) => [index("exam_user_idx").on(t.userId, t.startedAt)],
);

// ─── 5. posms: maksājumi ───────────────────────────────────────────────

export const orderStatus = pgEnum("order_status", ["pending", "paid", "failed", "canceled", "refunded"]);
/** manual = piekļuvi piešķīris administrators (skaidra nauda vai bez maksas), bez rēķina */
export const paymentProvider = pgEnum("payment_provider", ["stripe", "montonio", "dev", "manual"]);

export interface OrderBuyer {
  name: string;
  email: string;
  company?: string;
  regNo?: string;
  vatNo?: string;
  address?: string;
}

/** Rēķinu numuru secība (piešķir tikai apmaksātiem pasūtījumiem — numerācija bez robiem). */
export const invoiceSeq = pgSequence("invoice_seq", { startWith: 1 });

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: orderStatus("status").notNull().default("pending"),
    provider: paymentProvider("provider").notNull(),
    /** Stripe Checkout Session id / Montonio order uuid */
    providerRef: text("provider_ref"),
    product: text("product").notNull(),
    amountCents: integer("amount_cents").notNull(),
    netCents: integer("net_cents").notNull(),
    vatCents: integer("vat_cents").notNull(),
    vatRate: integer("vat_rate").notNull(),
    currency: text("currency").notNull().default("EUR"),
    buyer: jsonb("buyer").$type<OrderBuyer>().notNull(),
    /** Piekrišana tūlītējai piekļuvei digitālajam saturam un atteikuma tiesību zaudēšanai */
    waiverAcceptedAt: timestamp("waiver_accepted_at", { withTimezone: true }).notNull(),
    invoiceNumber: text("invoice_number").unique(),
    /** Administratora piezīme (manuālai piekļuvei: veids, čeka Nr. u. tml.) */
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
  },
  (t) => [index("orders_user_idx").on(t.userId, t.createdAt), index("orders_provider_ref_idx").on(t.providerRef)],
);

// ─── Dizaina labojumi (administratora piezīmes uz lapas elementiem) ─────────────

export const noteStatus = pgEnum("note_status", ["open", "done"]);

export const designNotes = pgTable(
  "design_notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    selector: text("selector").notNull(),
    /** īss elementa teksta fragments, lai saprastu, kas atzīmēts */
    elementText: text("element_text"),
    viewportWidth: integer("viewport_width").notNull(),
    viewportHeight: integer("viewport_height").notNull(),
    comment: text("comment").notNull(),
    status: noteStatus("status").notNull().default("open"),
    /** atbilde no izstrādātāja (kas izdarīts) */
    reply: text("reply"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [index("design_notes_status_idx").on(t.status, t.createdAt), index("design_notes_path_idx").on(t.path)],
);

// ─── Pieslēgšanās vēsture (konta koplietošanas pazīmēm; glabā 90 dienas) ───────

export const loginEvents = pgTable(
  "login_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_events_user_time_idx").on(t.userId, t.createdAt)],
);

/** Lietotāja pagrieziena punkti: kad pirmo reizi sasniegts 70 % progresa (no tā brīža skaita izmēģinājuma eksāmenus). */
export const userMilestones = pgTable("user_milestones", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  examsUnlockedAt: timestamp("exams_unlocked_at", { withTimezone: true }).notNull(),
});
