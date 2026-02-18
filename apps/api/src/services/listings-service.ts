import { db, schema } from "@hidden-gems/db";
import { and, asc, desc, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { ensureListingType, getPublishReadinessErrors, parseLatLng } from "../utils/listings";
import { getPublicListingMedia } from "./media-service";

export async function createDraftListing(userId: string, payload: Record<string, unknown>) {
  const hostId = typeof payload.hostId === "string" ? payload.hostId : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const type = ensureListingType(payload.type);
  if (!hostId || !title || !type) {
    return { error: "hostId, title, and type are required.", status: 400 as const };
  }

  const [host] = await db.select().from(schema.hosts).where(eq(schema.hosts.id, hostId)).limit(1);
  if (!host || host.ownerUserId !== userId) {
    return { error: "Only host owners can create listings.", status: 403 as const };
  }

  const coords = parseLatLng(payload.lat, payload.lng);
  if (coords === null) {
    return { error: "Invalid coordinates.", status: 400 as const };
  }

  const [listing] = await db
    .insert(schema.listings)
    .values({
      hostId,
      createdByUserId: userId,
      title,
      type,
      description: typeof payload.description === "string" ? payload.description.trim() : null,
      timezone: typeof payload.timezone === "string" ? payload.timezone.trim() : null,
      locationText: typeof payload.locationText === "string" ? payload.locationText.trim() : null,
      lat: coords.lat,
      lng: coords.lng,
    })
    .returning();

  return { listing, status: 201 as const };
}

export async function updateDraftListing(
  userId: string,
  listingId: string,
  payload: Record<string, unknown>,
) {
  const [existing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);
  if (!existing) {
    return { error: "Listing not found.", status: 404 as const };
  }
  if (existing.createdByUserId !== userId) {
    return { error: "Forbidden.", status: 403 as const };
  }

  const coords = parseLatLng(payload.lat, payload.lng);
  if (coords === null) {
    return { error: "Invalid coordinates.", status: 400 as const };
  }

  const updatedType = payload.type ? (ensureListingType(payload.type) ?? undefined) : undefined;
  if (payload.type && !updatedType) {
    return { error: "Invalid listing type.", status: 400 as const };
  }

  const [updated] = await db
    .update(schema.listings)
    .set({
      title: typeof payload.title === "string" ? payload.title.trim() : undefined,
      description: typeof payload.description === "string" ? payload.description.trim() : undefined,
      type: updatedType,
      startAt: payload.startAt ? new Date(String(payload.startAt)) : undefined,
      timezone: typeof payload.timezone === "string" ? payload.timezone.trim() : undefined,
      lat: coords?.lat ?? undefined,
      lng: coords?.lng ?? undefined,
      locationText:
        typeof payload.locationText === "string" ? payload.locationText.trim() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(schema.listings.id, listingId))
    .returning();

  return { listing: updated };
}

export async function publishListing(userId: string, listingId: string) {
  const [existing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);
  if (!existing) {
    return { error: "Listing not found.", status: 404 as const };
  }
  if (existing.createdByUserId !== userId) {
    return { error: "Forbidden.", status: 403 as const };
  }
  const errors = getPublishReadinessErrors(existing);
  if (errors.length > 0) {
    return { error: "Listing is not publish-ready.", details: errors, status: 400 as const };
  }
  const [published] = await db
    .update(schema.listings)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.listings.id, listingId))
    .returning();
  return { listing: published };
}

export async function getFeed(params: {
  limit?: string;
  cursor?: string;
  radiusKm?: string;
  lat?: string;
  lng?: string;
}) {
  const limitRaw = Number(params.limit ?? "20");
  const cursorRaw = params.cursor;
  const radiusKm = Number(params.radiusKm ?? "");
  const userLat = Number(params.lat ?? "");
  const userLng = Number(params.lng ?? "");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;

  const baseConditions = [eq(schema.listings.status, "published")];
  if (cursorRaw) {
    baseConditions.push(lte(schema.listings.createdAt, new Date(cursorRaw)));
  }
  const listings = await db
    .select()
    .from(schema.listings)
    .where(and(...baseConditions))
    .orderBy(desc(schema.listings.createdAt))
    .limit(limit + 1);

  let filtered = listings;
  if (
    Number.isFinite(radiusKm) &&
    radiusKm > 0 &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLng)
  ) {
    const radiusMeters = radiusKm * 1000;
    filtered = listings.filter((listing) => {
      if (listing.lat === null || listing.lng === null) {
        return false;
      }
      const earth = 6371000;
      const dLat = ((listing.lat - userLat) * Math.PI) / 180;
      const dLng = ((listing.lng - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((listing.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return earth * c <= radiusMeters;
    });
  }
  const hasNextPage = filtered.length > limit;
  const page = filtered.slice(0, limit);

  const listingIds = page.map((listing) => listing.id);
  let coverImageByListingId = new Map<string, string>();

  if (listingIds.length > 0) {
    const photoRows = await db
      .select({
        listingId: schema.listingPhotos.listingId,
        url: schema.media.url,
      })
      .from(schema.listingPhotos)
      .innerJoin(schema.media, eq(schema.media.id, schema.listingPhotos.mediaId))
      .where(inArray(schema.listingPhotos.listingId, listingIds))
      .orderBy(asc(schema.listingPhotos.sortOrder), asc(schema.listingPhotos.createdAt));

    coverImageByListingId = photoRows.reduce((acc, row) => {
      if (!acc.has(row.listingId)) {
        acc.set(row.listingId, row.url);
      }
      return acc;
    }, new Map<string, string>());
  }

  const listingsWithCovers = page.map((listing) => ({
    ...listing,
    coverImageUrl: coverImageByListingId.get(listing.id) ?? null,
  }));

  const nextCursor = hasNextPage ? page.at(-1)?.createdAt?.toISOString() : null;
  return { listings: listingsWithCovers, nextCursor };
}

export async function getMapListings(bboxRaw?: string) {
  const bounds = bboxRaw?.split(",").map(Number) ?? [];
  const conditions = [
    eq(schema.listings.status, "published"),
    isNotNull(schema.listings.lat),
    isNotNull(schema.listings.lng),
  ];
  if (bounds.length === 4 && bounds.every((value) => Number.isFinite(value))) {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const hasValidRanges = minLng <= maxLng && minLat <= maxLat;
    const inWorldBounds = minLng >= -180 && maxLng <= 180 && minLat >= -90 && maxLat <= 90;
    if (hasValidRanges && inWorldBounds) {
      conditions.push(gte(schema.listings.lat, minLat));
      conditions.push(lte(schema.listings.lat, maxLat));
      conditions.push(gte(schema.listings.lng, minLng));
      conditions.push(lte(schema.listings.lng, maxLng));
    }
  }
  const listings = await db
    .select({
      id: schema.listings.id,
      title: schema.listings.title,
      lat: schema.listings.lat,
      lng: schema.listings.lng,
      locationText: schema.listings.locationText,
      status: schema.listings.status,
    })
    .from(schema.listings)
    .where(and(...conditions))
    .orderBy(desc(schema.listings.publishedAt))
    .limit(500);
  return { listings };
}

export async function getListingById(listingId: string, userId: string | null) {
  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);
  if (!listing) {
    return { error: "Listing not found.", status: 404 as const };
  }
  if (listing.status !== "published" && listing.createdByUserId !== userId) {
    return { error: "Listing not found.", status: 404 as const };
  }

  const photoRows = await getPublicListingMedia(listing.id);
  const photos = photoRows.map((row, index) => ({
    isCover: index === 0,
    sortOrder: row.sortOrder,
    ...row.media,
  }));

  return {
    listing: {
      ...listing,
      photos,
      coverImageUrl: photos[0]?.url ?? null,
    },
  };
}
