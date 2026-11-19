CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'canceled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'montonio', 'dev');--> statement-breakpoint
CREATE SEQUENCE "public"."invoice_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_ref" text,
	"product" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"net_cents" integer NOT NULL,
	"vat_cents" integer NOT NULL,
	"vat_rate" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"buyer" jsonb NOT NULL,
	"waiver_accepted_at" timestamp with time zone NOT NULL,
	"invoice_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	CONSTRAINT "orders_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_provider_ref_idx" ON "orders" USING btree ("provider_ref");