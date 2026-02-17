import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { listings } from "./listings";
import { users } from "./users";

export const reportStatusEnum = pgEnum("report_status", ["open", "reviewed"]);

export const reports = pgTable("reports", {
  id: text("id").primaryKey().$defaultFn(createId),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  reporterUserId: text("reporter_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  details: text("details"),
  status: reportStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
