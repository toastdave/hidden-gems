import { describe, expect, test } from "bun:test";
import { ensureListingType, getPublishReadinessErrors, parseLatLng } from "./listings";

describe("listings utils", () => {
  test("parseLatLng accepts valid coordinate pairs", () => {
    expect(parseLatLng(40.7128, -74.006)).toEqual({ lat: 40.7128, lng: -74.006 });
  });

  test("parseLatLng rejects out-of-range coordinates", () => {
    expect(parseLatLng(95, 10)).toBeNull();
    expect(parseLatLng(20, -181)).toBeNull();
  });

  test("ensureListingType validates allowed values", () => {
    expect(ensureListingType("event")).toBe("event");
    expect(ensureListingType("something-else")).toBeNull();
  });

  test("publish readiness errors include required fields", () => {
    const errors = getPublishReadinessErrors({
      id: "listing-1",
      hostId: "host-1",
      createdByUserId: "user-1",
      status: "draft",
      title: "",
      description: null,
      type: "event",
      startAt: null,
      timezone: null,
      locationText: null,
      lat: null,
      lng: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(errors).toContain("Title is required.");
    expect(errors).toContain("Location coordinates are required.");
    expect(errors).toContain("Location text is required.");
  });
});
