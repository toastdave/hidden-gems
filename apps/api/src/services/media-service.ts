import { db, schema } from "@hidden-gems/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  buildPublicMediaUrl,
  deleteObject,
  getStorageBucket,
  objectExists,
  presignUploadUrl,
  statObject,
  storageEnabled,
} from "../utils/media-storage";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

async function requireListingOwner(userId: string, listingId: string) {
  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);

  if (!listing) {
    return { error: "Listing not found.", status: 404 as const };
  }
  if (listing.createdByUserId !== userId) {
    return { error: "Forbidden.", status: 403 as const };
  }

  return { listing };
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase();
  if (!trimmed) {
    return "upload";
  }

  return trimmed
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function parseUploadMetadata(payload: Record<string, unknown>) {
  const contentType = typeof payload.contentType === "string" ? payload.contentType.trim() : "";
  const sizeBytes = Number(payload.sizeBytes);
  const fileName = typeof payload.fileName === "string" ? payload.fileName.trim() : "";

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return { error: "Unsupported media type.", status: 400 as const };
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES) {
    return {
      error: `File size must be between 1 byte and ${MAX_UPLOAD_BYTES} bytes.`,
      status: 400 as const,
    };
  }

  if (!fileName) {
    return { error: "fileName is required.", status: 400 as const };
  }

  return {
    contentType,
    sizeBytes,
    fileName,
  };
}

function parseNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function parseIntegerOrNull(value: unknown) {
  const parsed = parseNumberOrNull(value);
  if (parsed === null) {
    return null;
  }
  return Math.round(parsed);
}

export async function createListingMediaUpload(
  userId: string,
  listingId: string,
  payload: Record<string, unknown>,
) {
  const listingResult = await requireListingOwner(userId, listingId);
  if ("error" in listingResult) {
    return listingResult;
  }

  if (!storageEnabled()) {
    return { error: "S3 storage is not configured.", status: 500 as const };
  }

  const metadata = parseUploadMetadata(payload);
  if ("error" in metadata) {
    return metadata;
  }

  const mediaId = crypto.randomUUID();
  const baseName = sanitizeFileName(metadata.fileName);
  const ext = CONTENT_TYPE_EXTENSIONS[metadata.contentType] ?? "bin";
  const objectKey = `listings/${listingId}/${baseName}-${mediaId}.${ext}`;
  const uploadUrl = presignUploadUrl(objectKey, metadata.contentType, 600);

  if (!uploadUrl) {
    return { error: "Unable to create upload URL.", status: 500 as const };
  }

  return {
    upload: {
      mediaId,
      objectKey,
      uploadUrl,
      method: "PUT",
      expiresIn: 600,
      contentType: metadata.contentType,
      sizeBytes: metadata.sizeBytes,
    },
  };
}

export async function completeListingMediaUpload(
  userId: string,
  listingId: string,
  payload: Record<string, unknown>,
) {
  const listingResult = await requireListingOwner(userId, listingId);
  if ("error" in listingResult) {
    return listingResult;
  }

  if (!storageEnabled()) {
    return { error: "S3 storage is not configured.", status: 500 as const };
  }

  const mediaId = typeof payload.mediaId === "string" ? payload.mediaId.trim() : "";
  const objectKey = typeof payload.objectKey === "string" ? payload.objectKey.trim() : "";
  const mimeType = typeof payload.contentType === "string" ? payload.contentType.trim() : "";
  const declaredSize = Number(payload.sizeBytes);
  const width = parseIntegerOrNull(payload.width);
  const height = parseIntegerOrNull(payload.height);

  if (!mediaId || !objectKey || !mimeType || !Number.isFinite(declaredSize) || declaredSize <= 0) {
    return {
      error: "mediaId, objectKey, contentType, and sizeBytes are required.",
      status: 400 as const,
    };
  }

  const expectedPrefix = `listings/${listingId}/`;
  if (!objectKey.startsWith(expectedPrefix)) {
    return { error: "Invalid object key for listing.", status: 400 as const };
  }

  const exists = await objectExists(objectKey);
  if (!exists) {
    return { error: "Uploaded object not found in storage.", status: 400 as const };
  }

  const storageStat = await statObject(objectKey);
  const sizeBytes = Number(storageStat?.size ?? declaredSize);
  const bucket = getStorageBucket();
  const publicUrl = buildPublicMediaUrl(objectKey);

  if (!bucket || !publicUrl) {
    return { error: "Storage URL configuration is incomplete.", status: 500 as const };
  }

  const [existingMedia] = await db
    .select()
    .from(schema.media)
    .where(eq(schema.media.id, mediaId))
    .limit(1);

  let media = existingMedia;
  if (!existingMedia) {
    const [inserted] = await db
      .insert(schema.media)
      .values({
        id: mediaId,
        uploadedByUserId: userId,
        bucket,
        storageKey: objectKey,
        url: publicUrl,
        mimeType,
        sizeBytes,
        width,
        height,
        etag: storageStat?.etag ?? null,
      })
      .onConflictDoNothing({ target: schema.media.id })
      .returning();
    media = inserted ?? null;
  }

  if (!media) {
    const [fallback] = await db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, mediaId))
      .limit(1);
    media = fallback ?? null;
  }

  if (!media) {
    return { error: "Unable to persist media metadata.", status: 500 as const };
  }

  const [existingListingPhoto] = await db
    .select()
    .from(schema.listingPhotos)
    .where(
      and(
        eq(schema.listingPhotos.listingId, listingId),
        eq(schema.listingPhotos.mediaId, media.id),
      ),
    )
    .limit(1);

  if (!existingListingPhoto) {
    const [sortRow] = await db
      .select({ maxSortOrder: sql<number>`coalesce(max(${schema.listingPhotos.sortOrder}), -1)` })
      .from(schema.listingPhotos)
      .where(eq(schema.listingPhotos.listingId, listingId));

    await db.insert(schema.listingPhotos).values({
      listingId,
      mediaId: media.id,
      sortOrder: Number(sortRow?.maxSortOrder ?? -1) + 1,
    });
  }

  return {
    media,
  };
}

export async function getListingMedia(userId: string, listingId: string) {
  const listingResult = await requireListingOwner(userId, listingId);
  if ("error" in listingResult) {
    return listingResult;
  }

  const rows = await db
    .select({
      relationId: schema.listingPhotos.id,
      sortOrder: schema.listingPhotos.sortOrder,
      linkedAt: schema.listingPhotos.createdAt,
      media: schema.media,
    })
    .from(schema.listingPhotos)
    .innerJoin(schema.media, eq(schema.media.id, schema.listingPhotos.mediaId))
    .where(eq(schema.listingPhotos.listingId, listingId))
    .orderBy(asc(schema.listingPhotos.sortOrder), asc(schema.listingPhotos.createdAt));

  const media = rows.map((row, index) => ({
    relationId: row.relationId,
    sortOrder: row.sortOrder,
    linkedAt: row.linkedAt,
    isCover: index === 0,
    ...row.media,
  }));

  return { media };
}

export async function reorderListingMedia(
  userId: string,
  listingId: string,
  payload: Record<string, unknown>,
) {
  const listingResult = await requireListingOwner(userId, listingId);
  if ("error" in listingResult) {
    return listingResult;
  }

  const mediaIds = Array.isArray(payload.mediaIds)
    ? payload.mediaIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : [];

  if (mediaIds.length === 0) {
    return { error: "mediaIds must contain at least one item.", status: 400 as const };
  }

  const rows = await db
    .select({ mediaId: schema.listingPhotos.mediaId })
    .from(schema.listingPhotos)
    .where(eq(schema.listingPhotos.listingId, listingId));

  const existing = new Set(rows.map((row) => row.mediaId));
  if (existing.size !== mediaIds.length) {
    return {
      error: "mediaIds must include all listing media items exactly once.",
      status: 400 as const,
    };
  }
  for (const mediaId of mediaIds) {
    if (!existing.has(mediaId)) {
      return { error: "mediaIds include unknown item for listing.", status: 400 as const };
    }
  }

  for (let index = 0; index < mediaIds.length; index += 1) {
    const mediaId = mediaIds[index];
    await db
      .update(schema.listingPhotos)
      .set({ sortOrder: index })
      .where(
        and(
          eq(schema.listingPhotos.listingId, listingId),
          eq(schema.listingPhotos.mediaId, mediaId),
        ),
      );
  }

  return getListingMedia(userId, listingId);
}

export async function setListingMediaCover(userId: string, listingId: string, mediaId: string) {
  const listingResult = await requireListingOwner(userId, listingId);
  if ("error" in listingResult) {
    return listingResult;
  }

  const rows = await db
    .select({ mediaId: schema.listingPhotos.mediaId, sortOrder: schema.listingPhotos.sortOrder })
    .from(schema.listingPhotos)
    .where(eq(schema.listingPhotos.listingId, listingId))
    .orderBy(asc(schema.listingPhotos.sortOrder), asc(schema.listingPhotos.createdAt));

  if (rows.length === 0) {
    return { error: "Listing has no media to reorder.", status: 400 as const };
  }

  const ids = rows.map((row) => row.mediaId);
  if (!ids.includes(mediaId)) {
    return { error: "Media item not found for listing.", status: 404 as const };
  }

  const reordered = [mediaId, ...ids.filter((id) => id !== mediaId)];
  return reorderListingMedia(userId, listingId, { mediaIds: reordered });
}

export async function removeListingMedia(userId: string, listingId: string, mediaId: string) {
  const listingResult = await requireListingOwner(userId, listingId);
  if ("error" in listingResult) {
    return listingResult;
  }

  const [linked] = await db
    .select()
    .from(schema.listingPhotos)
    .where(
      and(eq(schema.listingPhotos.listingId, listingId), eq(schema.listingPhotos.mediaId, mediaId)),
    )
    .limit(1);

  if (!linked) {
    return { error: "Media item not found for listing.", status: 404 as const };
  }

  await db
    .delete(schema.listingPhotos)
    .where(
      and(eq(schema.listingPhotos.listingId, listingId), eq(schema.listingPhotos.mediaId, mediaId)),
    );

  const [remainingLinks] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.listingPhotos)
    .where(eq(schema.listingPhotos.mediaId, mediaId));

  if (Number(remainingLinks?.count ?? 0) === 0) {
    const [media] = await db
      .select()
      .from(schema.media)
      .where(eq(schema.media.id, mediaId))
      .limit(1);

    await db.delete(schema.media).where(eq(schema.media.id, mediaId));

    if (media) {
      try {
        await deleteObject(media.storageKey);
      } catch (error) {
        console.warn("Failed to delete media object from storage", {
          mediaId,
          storageKey: media.storageKey,
          error,
        });
      }
    }
  }

  return { removed: true };
}

export async function getPublicListingMedia(listingId: string) {
  return db
    .select({
      sortOrder: schema.listingPhotos.sortOrder,
      media: schema.media,
    })
    .from(schema.listingPhotos)
    .innerJoin(schema.media, eq(schema.media.id, schema.listingPhotos.mediaId))
    .where(eq(schema.listingPhotos.listingId, listingId))
    .orderBy(asc(schema.listingPhotos.sortOrder), desc(schema.listingPhotos.createdAt));
}
