ALTER TABLE "orders" ALTER COLUMN "waiver_accepted_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_code" text DEFAULT 'course' NOT NULL;--> statement-breakpoint
-- Esošie testa pirkumi (1,50 €)
UPDATE "orders" SET "product_code" = 'test' WHERE "product" LIKE '%testa pirkums%';
