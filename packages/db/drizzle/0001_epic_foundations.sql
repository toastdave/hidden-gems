DO $$
BEGIN
  CREATE TYPE "public"."host_type" AS ENUM('individual', 'organization');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "hosts" RENAME COLUMN "user_id" TO "owner_user_id";
--> statement-breakpoint
ALTER TABLE "hosts" ADD COLUMN IF NOT EXISTS "type" "host_type" DEFAULT 'individual' NOT NULL;
--> statement-breakpoint
ALTER TABLE "hosts" ADD COLUMN IF NOT EXISTS "name" text DEFAULT 'Host' NOT NULL;
--> statement-breakpoint
ALTER TABLE "hosts" ADD COLUMN IF NOT EXISTS "contact_email" text;
--> statement-breakpoint
ALTER TABLE "hosts" ADD COLUMN IF NOT EXISTS "contact_phone" text;
--> statement-breakpoint
ALTER TABLE "hosts" ALTER COLUMN "bio" SET DEFAULT '';
--> statement-breakpoint
ALTER TABLE "hosts" DROP CONSTRAINT IF EXISTS "hosts_user_id_unique";
--> statement-breakpoint
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_owner_user_id_unique" UNIQUE("owner_user_id");
--> statement-breakpoint
ALTER TABLE "hosts" DROP CONSTRAINT IF EXISTS "hosts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_alerts" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "radius_km" integer NOT NULL,
  "filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE "saved_alerts" ADD CONSTRAINT "saved_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
  "id" text PRIMARY KEY NOT NULL,
  "listing_id" text NOT NULL,
  "reporter_user_id" text NOT NULL,
  "reason" text NOT NULL,
  "details" text,
  "status" "report_status" DEFAULT 'open' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_status_created_at_idx" ON "listings" ("status", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_status_published_at_idx" ON "listings" ("status", "published_at");
