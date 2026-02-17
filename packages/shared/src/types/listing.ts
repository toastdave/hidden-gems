export type ListingStatus = "draft" | "published" | "archived";

export type ListingType = "event" | "place" | "activity";

export interface Listing {
  id: string;
  hostId: string;
  createdByUserId: string;
  title: string;
  description: string | null;
  type: ListingType;
  status: ListingStatus;
  startAt: Date | null;
  timezone: string | null;
  lat: number | null;
  lng: number | null;
  locationText: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
