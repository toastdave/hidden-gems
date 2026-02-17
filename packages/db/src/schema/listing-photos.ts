import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { listings } from "./listings";
import { media } from "./media";

export const listingPhotos = pgTable("listing_photos", {
  id: text("id").primaryKey().$defaultFn(createId),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  mediaId: text("media_id")
    .notNull()
    .references(() => media.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
