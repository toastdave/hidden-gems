import { db, schema } from "@hidden-gems/db";
import { eq } from "drizzle-orm";
import {
  buildPublicMediaUrl,
  objectExists,
  presignUploadUrl,
  statObject,
  storageEnabled,
} from "../utils/media-storage";

const PROFILE_DISPLAY_NAME_MAX = 80;
const AVATAR_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const AVATAR_ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const AVATAR_CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase();
  if (!trimmed) {
    return "avatar";
  }

  return trimmed
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function normalizeDisplayName(value: unknown) {
  if (value === undefined) {
    return { value: undefined as string | null | undefined };
  }

  if (value === null) {
    return { value: null as string | null };
  }

  if (typeof value !== "string") {
    return { error: "displayName must be a string.", status: 400 as const };
  }

  const trimmed = value.trim();
  if (trimmed.length > PROFILE_DISPLAY_NAME_MAX) {
    return {
      error: `displayName must be ${PROFILE_DISPLAY_NAME_MAX} characters or fewer.`,
      status: 400 as const,
    };
  }

  return { value: trimmed.length === 0 ? null : trimmed };
}

function parseLatLng(value: unknown) {
  if (value === undefined) {
    return { value: undefined as number | null | undefined };
  }

  if (value === null || value === "") {
    return { value: null as number | null };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { error: "Coordinates must be valid numbers.", status: 400 as const };
  }

  return { value: parsed };
}

function toProfileRow(user: typeof schema.users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    homeLat: user.homeLat,
    homeLng: user.homeLng,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getMyProfile(userId: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) {
    return { error: "User not found.", status: 404 as const };
  }

  return {
    profile: toProfileRow(user),
  };
}

export async function updateMyProfile(userId: string, payload: Record<string, unknown>) {
  const displayName = normalizeDisplayName(payload.displayName);
  if ("error" in displayName) {
    return displayName;
  }

  const homeLat = parseLatLng(payload.homeLat);
  if ("error" in homeLat) {
    return homeLat;
  }

  const homeLng = parseLatLng(payload.homeLng);
  if ("error" in homeLng) {
    return homeLng;
  }

  const nextLat = homeLat.value;
  const nextLng = homeLng.value;
  const updates: Partial<typeof schema.users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (displayName.value !== undefined) {
    updates.displayName = displayName.value;
  }

  if (nextLat !== undefined || nextLng !== undefined) {
    if ((nextLat === null) !== (nextLng === null)) {
      return {
        error: "homeLat and homeLng must both be provided, or both set to null.",
        status: 400 as const,
      };
    }

    if (typeof nextLat === "number" && (nextLat < -90 || nextLat > 90)) {
      return { error: "homeLat must be between -90 and 90.", status: 400 as const };
    }

    if (typeof nextLng === "number" && (nextLng < -180 || nextLng > 180)) {
      return { error: "homeLng must be between -180 and 180.", status: 400 as const };
    }

    updates.homeLat = nextLat;
    updates.homeLng = nextLng;
  }

  const [updated] = await db
    .update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, userId))
    .returning();

  if (!updated) {
    return { error: "User not found.", status: 404 as const };
  }

  return { profile: toProfileRow(updated) };
}

export async function createAvatarUpload(userId: string, payload: Record<string, unknown>) {
  if (!storageEnabled()) {
    return { error: "S3 storage is not configured.", status: 500 as const };
  }

  const contentType = typeof payload.contentType === "string" ? payload.contentType.trim() : "";
  const fileName = typeof payload.fileName === "string" ? payload.fileName.trim() : "";
  const sizeBytes = Number(payload.sizeBytes);

  if (!fileName || !contentType || !Number.isFinite(sizeBytes)) {
    return {
      error: "fileName, contentType, and sizeBytes are required.",
      status: 400 as const,
    };
  }

  if (!AVATAR_ALLOWED_MIME_TYPES.has(contentType)) {
    return { error: "Unsupported avatar content type.", status: 400 as const };
  }

  if (sizeBytes <= 0 || sizeBytes > AVATAR_MAX_UPLOAD_BYTES) {
    return {
      error: `Avatar size must be between 1 byte and ${AVATAR_MAX_UPLOAD_BYTES} bytes.`,
      status: 400 as const,
    };
  }

  const avatarId = crypto.randomUUID();
  const ext = AVATAR_CONTENT_TYPE_EXTENSIONS[contentType] ?? "bin";
  const baseName = sanitizeFileName(fileName);
  const objectKey = `avatars/${userId}/${baseName}-${avatarId}.${ext}`;
  const uploadUrl = presignUploadUrl(objectKey, contentType, 600);

  if (!uploadUrl) {
    return { error: "Unable to create upload URL.", status: 500 as const };
  }

  return {
    upload: {
      objectKey,
      uploadUrl,
      expiresIn: 600,
      method: "PUT",
      contentType,
      sizeBytes,
    },
  };
}

export async function completeAvatarUpload(userId: string, payload: Record<string, unknown>) {
  if (!storageEnabled()) {
    return { error: "S3 storage is not configured.", status: 500 as const };
  }

  const objectKey = typeof payload.objectKey === "string" ? payload.objectKey.trim() : "";
  const contentType = typeof payload.contentType === "string" ? payload.contentType.trim() : "";

  if (!objectKey || !contentType) {
    return { error: "objectKey and contentType are required.", status: 400 as const };
  }

  if (!AVATAR_ALLOWED_MIME_TYPES.has(contentType)) {
    return { error: "Unsupported avatar content type.", status: 400 as const };
  }

  if (!objectKey.startsWith(`avatars/${userId}/`)) {
    return { error: "Invalid object key for user avatar.", status: 400 as const };
  }

  const exists = await objectExists(objectKey);
  if (!exists) {
    return { error: "Uploaded avatar object not found.", status: 400 as const };
  }

  const objectStat = await statObject(objectKey);
  const objectSize = Number(objectStat?.size ?? 0);
  if (objectSize <= 0 || objectSize > AVATAR_MAX_UPLOAD_BYTES) {
    return { error: "Uploaded avatar has invalid file size.", status: 400 as const };
  }

  const avatarUrl = buildPublicMediaUrl(objectKey);
  if (!avatarUrl) {
    return { error: "Storage URL configuration is incomplete.", status: 500 as const };
  }

  const [updated] = await db
    .update(schema.users)
    .set({
      avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))
    .returning();

  if (!updated) {
    return { error: "User not found.", status: 404 as const };
  }

  return {
    profile: toProfileRow(updated),
  };
}

export async function updateHomeLocation(userId: string, lat: number, lng: number) {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: "Invalid coordinates.", status: 400 as const };
  }

  const [updated] = await db
    .update(schema.users)
    .set({
      homeLat: lat,
      homeLng: lng,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))
    .returning({
      id: schema.users.id,
      homeLat: schema.users.homeLat,
      homeLng: schema.users.homeLng,
    });

  if (!updated) {
    return { error: "User not found.", status: 404 as const };
  }

  return { location: updated };
}

export async function getHomeLocation(userId: string) {
  const [user] = await db
    .select({
      homeLat: schema.users.homeLat,
      homeLng: schema.users.homeLng,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  return {
    homeLat: user?.homeLat ?? null,
    homeLng: user?.homeLng ?? null,
  };
}
