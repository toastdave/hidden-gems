import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { listings } from "./listings";
import { users } from "./users";

export const favorites = pgTable(
  "favorites",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("favorites_user_listing_unique").on(t.userId, t.listingId)],
);
