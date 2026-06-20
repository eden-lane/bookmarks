CREATE TYPE "public"."favicon_status" AS ENUM('pending', 'fetched', 'failed');--> statement-breakpoint
CREATE TYPE "public"."metadata_status" AS ENUM('pending', 'fetched', 'failed');--> statement-breakpoint
CREATE TABLE "favicons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin" text NOT NULL,
	"source_url" text,
	"content_type" text,
	"image_bytes" "bytea",
	"status" "favicon_status" DEFAULT 'pending' NOT NULL,
	"fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_items" ADD COLUMN "site_name" text;--> statement-breakpoint
ALTER TABLE "saved_items" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "saved_items" ADD COLUMN "metadata_status" "metadata_status";--> statement-breakpoint
UPDATE "saved_items" SET "metadata_status" = case when "title" is not null or "description" is not null then 'fetched'::"metadata_status" else 'failed'::"metadata_status" end;--> statement-breakpoint
ALTER TABLE "saved_items" ALTER COLUMN "metadata_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "saved_items" ALTER COLUMN "metadata_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "saved_items" ADD COLUMN "metadata_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "saved_items" ADD COLUMN "favicon_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "favicons_origin_unique_idx" ON "favicons" USING btree ("origin");--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_favicon_id_favicons_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."favicons"("id") ON DELETE set null ON UPDATE no action;
