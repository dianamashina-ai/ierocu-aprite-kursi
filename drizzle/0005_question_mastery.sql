ALTER TABLE "question_progress" ADD COLUMN "mastered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "question_progress" ADD COLUMN "streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Esošais stāvoklis: kas bija pareizi atbildēts pēdējo reizi, paliek apgūts
UPDATE "question_progress" SET "mastered" = "last_correct", "streak" = CASE WHEN "last_correct" THEN 1 ELSE -1 END;
