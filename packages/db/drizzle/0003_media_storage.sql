ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "bucket" text;
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "storage_key" text;
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "width" integer;
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "height" integer;
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "etag" text;
--> statement-breakpoint
UPDATE "media"
SET
  "bucket" = COALESCE("bucket", 'legacy'),
  "storage_key" = COALESCE("storage_key", CONCAT('legacy/', "id"));
--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "bucket" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "storage_key" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "media_storage_key_idx" ON "media" ("storage_key");
