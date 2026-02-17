import type { Context } from "hono";
import { requireAuth, requireUserId } from "../middleware/auth-guards";
import { getPublicHost, upsertHostForUser } from "../services/hosts-service";
import type { ApiEnv } from "../types/api";

export async function createHostHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) {
    return authError;
  }
  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await upsertHostForUser(requireUserId(c), payload);
  if ("error" in result) {
    return c.json({ error: result.error }, result.status);
  }
  return c.json({ host: result.host }, 201);
}

export async function getHostHandler(c: Context<ApiEnv>) {
  const result = await getPublicHost(c.req.param("id"));
  if ("error" in result) {
    return c.json({ error: result.error }, result.status);
  }
  return c.json(result);
}
