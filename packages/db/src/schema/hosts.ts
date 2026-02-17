import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { users } from "./users";

export const hostTypeEnum = pgEnum("host_type", ["individual", "organization"]);

export const hosts = pgTable("hosts", {
  id: text("id").primaryKey().$defaultFn(createId),
  ownerUserId: text("owner_user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  type: hostTypeEnum("type").notNull().default("individual"),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  bio: text("bio").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
