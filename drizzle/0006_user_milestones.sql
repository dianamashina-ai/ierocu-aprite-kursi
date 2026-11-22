CREATE TABLE "user_milestones" (
	"user_id" text PRIMARY KEY NOT NULL,
	"exams_unlocked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_milestones" ADD CONSTRAINT "user_milestones_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Lietotāji, kuri jau sasnieguši 70 %: skaitām eksāmenus no šī brīža
INSERT INTO "user_milestones" ("user_id", "exams_unlocked_at")
SELECT qp."user_id", now()
FROM "question_progress" qp
GROUP BY qp."user_id"
HAVING round(100.0 * count(*) FILTER (WHERE qp."mastered") / NULLIF((SELECT count(*) FROM "questions"), 0)) >= 70
ON CONFLICT DO NOTHING;
