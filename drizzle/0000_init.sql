CREATE TYPE "public"."explanation_status" AS ENUM('draft', 'reviewed');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"title_lv" text NOT NULL,
	"title_ru" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "official_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"question_id" integer NOT NULL,
	"key" text NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL,
	"printed_label" text NOT NULL,
	CONSTRAINT "question_options_question_id_key_pk" PRIMARY KEY("question_id","key"),
	CONSTRAINT "question_options_key" CHECK ("question_options"."key" ~ '^[a-f]$'),
	CONSTRAINT "question_options_position" CHECK ("question_options"."position" between 1 and 6)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" integer PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"official_section_id" text NOT NULL,
	"text" text NOT NULL,
	"correct_key" text NOT NULL,
	"source_page" integer NOT NULL,
	"family_id" integer,
	"explanation_lv" text,
	"explanation_ru" text,
	"explanation_status" "explanation_status" DEFAULT 'draft' NOT NULL,
	"law_reference" text,
	"possibly_outdated" boolean DEFAULT false NOT NULL,
	"outdated_note" text,
	"shuffle_disabled" boolean DEFAULT false NOT NULL,
	"shuffle_note" text,
	"correction_note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_id_range" CHECK ("questions"."id" > 0)
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"order" integer NOT NULL,
	"title_lv" text NOT NULL,
	"title_ru" text NOT NULL,
	"law_hint" text,
	"possibly_outdated" boolean DEFAULT false NOT NULL,
	"outdated_note" text
);
--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_official_section_id_official_sections_id_fk" FOREIGN KEY ("official_section_id") REFERENCES "public"."official_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "questions_topic_idx" ON "questions" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "questions_section_idx" ON "questions" USING btree ("official_section_id");--> statement-breakpoint
CREATE INDEX "questions_family_idx" ON "questions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "topics_module_idx" ON "topics" USING btree ("module_id");