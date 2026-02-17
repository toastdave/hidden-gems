import type { Context } from "hono";
import type { ApiEnv } from "../types/api";

export function readBearerUserId(c: Context<ApiEnv>) {
  const user = c.get("user");
  return user?.id ?? null;
}

export function requireUserId(c: Context<ApiEnv>) {
  const userId = readBearerUserId(c);
  if (!userId) {
    throw new Error("Authenticated route missing user context.");
  }
  return userId;
}

export async function requireAuth(c: Context<ApiEnv>) {
  const userId = readBearerUserId(c);
  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }
  return null;
}
