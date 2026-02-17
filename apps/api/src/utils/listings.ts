import type { schema } from "@hidden-gems/db";
import type { ListingType } from "@hidden-gems/shared";

const VALID_LISTING_TYPES: ListingType[] = ["event", "place", "activity"];

export function parseLatLng(lat: unknown, lng: unknown) {
  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    return { lat: null, lng: null };
  }
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return null;
  }
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return null;
  }
  return { lat: latNum, lng: lngNum };
}

export function ensureListingType(value: unknown): ListingType | null {
  if (typeof value !== "string") {
    return null;
  }
  if (!VALID_LISTING_TYPES.includes(value as ListingType)) {
    return null;
  }
  return value as ListingType;
}

export function getPublishReadinessErrors(listing: typeof schema.listings.$inferSelect) {
  const errors: string[] = [];
  if (!listing.title?.trim()) {
    errors.push("Title is required.");
  }
  if (!listing.type) {
    errors.push("Listing type is required.");
  }
  if (listing.lat === null || listing.lng === null) {
    errors.push("Location coordinates are required.");
  }
  if (!listing.locationText?.trim()) {
    errors.push("Location text is required.");
  }
  return errors;
}
