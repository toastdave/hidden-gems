import type { Context } from "hono";
import { requireAuth, requireUserId } from "../middleware/auth-guards";
import { listFavorites, toggleFavorite } from "../services/favorites-service";
import type { ApiEnv } from "../types/api";

export async function toggleFavoriteHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const payload = (await c.req.json()) as Record<string, unknown>;
  const listingId = typeof payload.listingId === "string" ? payload.listingId : "";
  const result = await toggleFavorite(requireUserId(c), listingId);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function listFavoritesHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const result = await listFavorites(requireUserId(c));
  return c.json(result);
}
