import { db } from "@hidden-gems/db";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import type { ApiEnv } from "../types/api";

export const healthRoutes = new Hono<ApiEnv>();

healthRoutes.get("/", (c) => c.text("Hidden Gems API"));

healthRoutes.get("/health", async (c) => {
  const result = await db.execute(sql`select 1 as ok`);
  const dbOk = result.length > 0;
  return c.json({ status: "ok", database: dbOk, timestamp: new Date().toISOString() });
});
