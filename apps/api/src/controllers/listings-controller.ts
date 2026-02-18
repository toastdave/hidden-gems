import type { Context } from "hono";
import { readBearerUserId, requireAuth, requireUserId } from "../middleware/auth-guards";
import {
  createDraftListing,
  getFeed,
  getListingById,
  getMapListings,
  publishListing,
  updateDraftListing,
} from "../services/listings-service";
import {
  completeListingMediaUpload,
  createListingMediaUpload,
  getListingMedia,
  removeListingMedia,
  reorderListingMedia,
  setListingMediaCover,
} from "../services/media-service";
import type { ApiEnv } from "../types/api";

export async function createDraftHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await createDraftListing(requireUserId(c), payload);
  if ("error" in result) return c.json(result, result.status);
  return c.json({ listing: result.listing }, result.status);
}

export async function updateDraftHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await updateDraftListing(requireUserId(c), c.req.param("id"), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json({ listing: result.listing });
}

export async function publishHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const result = await publishListing(requireUserId(c), c.req.param("id"));
  if ("error" in result) return c.json(result, result.status);
  return c.json({ listing: result.listing });
}

export async function feedHandler(c: Context<ApiEnv>) {
  const result = await getFeed({
    limit: c.req.query("limit"),
    cursor: c.req.query("cursor"),
    radiusKm: c.req.query("radiusKm"),
    lat: c.req.query("lat"),
    lng: c.req.query("lng"),
  });
  return c.json(result);
}

export async function mapHandler(c: Context<ApiEnv>) {
  const result = await getMapListings(c.req.query("bbox"));
  return c.json(result);
}

export async function getListingHandler(c: Context<ApiEnv>) {
  const result = await getListingById(c.req.param("id"), readBearerUserId(c));
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json({ listing: result.listing });
}

export async function createListingMediaUploadHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await createListingMediaUpload(requireUserId(c), c.req.param("id"), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result, 201);
}

export async function completeListingMediaUploadHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await completeListingMediaUpload(requireUserId(c), c.req.param("id"), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result, 201);
}

export async function getListingMediaHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const result = await getListingMedia(requireUserId(c), c.req.param("id"));
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function reorderListingMediaHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const payload = (await c.req.json()) as Record<string, unknown>;
  const result = await reorderListingMedia(requireUserId(c), c.req.param("id"), payload);
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function setListingMediaCoverHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const result = await setListingMediaCover(
    requireUserId(c),
    c.req.param("id"),
    c.req.param("mediaId"),
  );
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}

export async function removeListingMediaHandler(c: Context<ApiEnv>) {
  const authError = await requireAuth(c);
  if (authError) return authError;

  const result = await removeListingMedia(
    requireUserId(c),
    c.req.param("id"),
    c.req.param("mediaId"),
  );
  if ("error" in result) return c.json({ error: result.error }, result.status);
  return c.json(result);
}
