import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";

export const plans = pgTable("plans", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  priceMonthly: integer("price_monthly").notNull(),
  maxListings: integer("max_listings").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
