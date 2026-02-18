import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "../utils";
import { users } from "./users";

export const media = pgTable("media", {
  id: text("id").primaryKey().$defaultFn(createId),
  uploadedByUserId: text("uploaded_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bucket: text("bucket").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  etag: text("etag"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
