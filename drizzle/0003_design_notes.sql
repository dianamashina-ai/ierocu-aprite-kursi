CREATE TYPE "public"."note_status" AS ENUM('open', 'done');--> statement-breakpoint
CREATE TABLE "design_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"path" text NOT NULL,
	"selector" text NOT NULL,
	"element_text" text,
	"viewport_width" integer NOT NULL,
	"viewport_height" integer NOT NULL,
	"comment" text NOT NULL,
	"status" "note_status" DEFAULT 'open' NOT NULL,
	"reply" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "design_notes" ADD CONSTRAINT "design_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "design_notes_status_idx" ON "design_notes" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "design_notes_path_idx" ON "design_notes" USING btree ("path");