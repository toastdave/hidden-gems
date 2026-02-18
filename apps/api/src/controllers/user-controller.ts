import type { Context } from "hono";
import { requireAuth, requireUserId } from "../middleware/auth-guards";
import { getHomeLocation, updateHomeLocation } from "../services/user-service";
import type { ApiEnv } from "../types/api";

export async function updateHomeLocationHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const payload = (await c.req.json()) as Record<string, unknown>;
  const lat = typeof payload.lat === "number" ? payload.lat : Number(payload.lat);
  const lng = typeof payload.lng === "number" ? payload.lng : Number(payload.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return c.json({ error: "lat and lng are required numbers." }, 400);
  }

  const result = await updateHomeLocation(requireUserId(c), lat, lng);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function getHomeLocationHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  return c.json(await getHomeLocation(requireUserId(c)));
}
