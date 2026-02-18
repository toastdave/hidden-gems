import type { Context } from "hono";
import { requireAuth, requireUserId } from "../middleware/auth-guards";
import {
  completeAvatarUpload,
  createAvatarUpload,
  getHomeLocation,
  getMyProfile,
  updateHomeLocation,
  updateMyProfile,
} from "../services/user-service";
import type { ApiEnv } from "../types/api";

export async function getMyProfileHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const result = await getMyProfile(requireUserId(c));
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function updateMyProfileHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await updateMyProfile(requireUserId(c), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function createAvatarUploadHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await createAvatarUpload(requireUserId(c), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result, 201);
}

export async function completeAvatarUploadHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await completeAvatarUpload(requireUserId(c), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

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
