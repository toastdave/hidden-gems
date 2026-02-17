import { doublePrecision, index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { hosts } from "./hosts";
import { users } from "./users";

export const listingStatusEnum = pgEnum("listing_status", ["draft", "published", "archived"]);

export const listingTypeEnum = pgEnum("listing_type", ["event", "place", "activity"]);

export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    hostId: text("host_id")
      .notNull()
      .references(() => hosts.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    type: listingTypeEnum("type").notNull(),
    status: listingStatusEnum("status").notNull().default("draft"),
    startAt: timestamp("start_at", { withTimezone: true }),
    timezone: text("timezone"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    locationText: text("location_text"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("listings_status_created_at_idx").on(t.status, t.createdAt),
    index("listings_status_published_at_idx").on(t.status, t.publishedAt),
  ],
);
