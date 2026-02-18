import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Hono } from "hono";

const listingStore = new Map<
  string,
  {
    id: string;
    status: "draft" | "published";
    title: string;
    lat: number | null;
    lng: number | null;
    locationText: string | null;
    createdByUserId: string;
  }
>();

const mediaStore = new Map<
  string,
  Array<{ id: string; url: string; isCover: boolean; sortOrder: number }>
>();

const createDraftListingMock = mock(async (userId: string, payload: Record<string, unknown>) => {
  const listing = {
    id: "listing-1",
    status: "draft" as const,
    title: typeof payload.title === "string" ? payload.title : "Untitled",
    lat: payload.lat == null ? null : Number(payload.lat),
    lng: payload.lng == null ? null : Number(payload.lng),
    locationText: typeof payload.locationText === "string" ? payload.locationText : null,
    createdByUserId: userId,
  };
  listingStore.set(listing.id, listing);
  return {
    listing,
    status: 201 as const,
  };
});

const updateDraftListingMock = mock(
  async (userId: string, listingId: string, payload: Record<string, unknown>) => {
    if (listingId === "forbidden") {
      return {
        error: "Forbidden.",
        status: 403 as const,
      };
    }

    const existing = listingStore.get(listingId);
    if (!existing) {
      return {
        error: "Listing not found.",
        status: 404 as const,
      };
    }

    if (existing.createdByUserId !== userId) {
      return {
        error: "Forbidden.",
        status: 403 as const,
      };
    }

    const updated = {
      ...existing,
      title: typeof payload.title === "string" ? payload.title : existing.title,
      lat: payload.lat == null ? existing.lat : Number(payload.lat),
      lng: payload.lng == null ? existing.lng : Number(payload.lng),
      locationText:
        typeof payload.locationText === "string" ? payload.locationText : existing.locationText,
    };
    listingStore.set(listingId, updated);
    return {
      listing: updated,
    };
  },
);

const getListingByIdMock = mock(async (listingId: string, userId: string | null) => {
  const listing = listingStore.get(listingId);
  if (!listing) {
    return { error: "Listing not found.", status: 404 as const };
  }
  if (listing.status !== "published" && listing.createdByUserId !== userId) {
    return { error: "Listing not found.", status: 404 as const };
  }

  return {
    listing,
  };
});

const createListingMediaUploadMock = mock(async (_userId: string, listingId: string) => ({
  upload: {
    mediaId: `media-${Date.now()}`,
    objectKey: `listings/${listingId}/photo.jpg`,
    uploadUrl: "https://example.com/upload",
    method: "PUT",
    expiresIn: 600,
  },
}));

const completeListingMediaUploadMock = mock(
  async (_userId: string, listingId: string, payload: Record<string, unknown>) => {
    const media = {
      id: String(payload.mediaId),
      url: `https://example.com/${String(payload.objectKey)}`,
      isCover: (mediaStore.get(listingId)?.length ?? 0) === 0,
      sortOrder: mediaStore.get(listingId)?.length ?? 0,
    };
    mediaStore.set(listingId, [...(mediaStore.get(listingId) ?? []), media]);
    return { media };
  },
);

const getListingMediaMock = mock(async (_userId: string, listingId: string) => ({
  media: mediaStore.get(listingId) ?? [],
}));

mock.module("../services/listings-service", () => ({
  createDraftListing: createDraftListingMock,
  updateDraftListing: updateDraftListingMock,
  publishListing: mock(async () => ({ listing: { id: "listing-1" } })),
  getFeed: mock(async () => ({ listings: [], nextCursor: null })),
  getMapListings: mock(async () => ({ listings: [] })),
  getListingById: getListingByIdMock,
}));

mock.module("../services/media-service", () => ({
  createListingMediaUpload: createListingMediaUploadMock,
  completeListingMediaUpload: completeListingMediaUploadMock,
  getListingMedia: getListingMediaMock,
  reorderListingMedia: mock(async () => ({ media: [] })),
  setListingMediaCover: mock(async () => ({ media: [] })),
  removeListingMedia: mock(async () => ({ removed: true })),
}));

const {
  completeListingMediaUploadHandler,
  createDraftHandler,
  createListingMediaUploadHandler,
  getListingHandler,
  getListingMediaHandler,
  updateDraftHandler,
} = await import("./listings-controller");

function buildAppWithUser() {
  const app = new Hono<{
    Variables: {
      user: {
        id: string;
        email: string;
        displayName: string | null;
        avatarUrl: string | null;
      } | null;
    };
  }>();

  app.use("*", async (c, next) => {
    c.set("user", {
      id: "user-1",
      email: "user@example.com",
      displayName: "User",
      avatarUrl: null,
    });
    await next();
  });

  app.post("/listings/drafts", createDraftHandler);
  app.patch("/listings/:id", updateDraftHandler);
  app.get("/listings/:id", getListingHandler);
  app.post("/listings/:id/media/upload-url", createListingMediaUploadHandler);
  app.post("/listings/:id/media/complete", completeListingMediaUploadHandler);
  app.get("/listings/:id/media", getListingMediaHandler);

  return app;
}

describe("listings controller auth and ownership patterns", () => {
  beforeEach(() => {
    listingStore.clear();
    mediaStore.clear();
    createDraftListingMock.mockClear();
    updateDraftListingMock.mockClear();
    getListingByIdMock.mockClear();
    createListingMediaUploadMock.mockClear();
    completeListingMediaUploadMock.mockClear();
    getListingMediaMock.mockClear();
  });

  test("authenticated listing create succeeds", async () => {
    const app = buildAppWithUser();
    const response = await app.request("/listings/drafts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostId: "host-1", title: "A title", type: "event" }),
    });

    expect(response.status).toBe(201);
    expect(createDraftListingMock).toHaveBeenCalled();
    const payload = await response.json();
    expect(payload.listing.id).toBe("listing-1");
    expect(payload.listing.status).toBe("draft");
  });

  test("unauthorized owner update fails with 403", async () => {
    const app = buildAppWithUser();
    const response = await app.request("/listings/forbidden", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });

    expect(response.status).toBe(403);
    expect(updateDraftListingMock).toHaveBeenCalled();
    expect(await response.json()).toEqual({ error: "Forbidden." });
  });

  test("location values persist across update and reload", async () => {
    const app = buildAppWithUser();
    await app.request("/listings/drafts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostId: "host-1", title: "Persist test", type: "event" }),
    });

    const updateResponse = await app.request("/listings/listing-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lat: 37.7749,
        lng: -122.4194,
        locationText: "San Francisco, CA",
      }),
    });

    expect(updateResponse.status).toBe(200);

    const reloadResponse = await app.request("/listings/listing-1", {
      method: "GET",
      headers: { authorization: "Bearer fake" },
    });

    expect(reloadResponse.status).toBe(200);
    const payload = await reloadResponse.json();
    expect(payload.listing.lat).toBe(37.7749);
    expect(payload.listing.lng).toBe(-122.4194);
    expect(payload.listing.locationText).toBe("San Francisco, CA");
  });

  test("media upload completion can be fetched as gallery metadata", async () => {
    const app = buildAppWithUser();
    await app.request("/listings/drafts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostId: "host-1", title: "Media test", type: "event" }),
    });

    const uploadResponse = await app.request("/listings/listing-1/media/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fileName: "photo.jpg", contentType: "image/jpeg", sizeBytes: 1024 }),
    });
    expect(uploadResponse.status).toBe(201);
    const uploadPayload = await uploadResponse.json();

    const completeResponse = await app.request("/listings/listing-1/media/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mediaId: uploadPayload.upload.mediaId,
        objectKey: uploadPayload.upload.objectKey,
        contentType: "image/jpeg",
        sizeBytes: 1024,
      }),
    });
    expect(completeResponse.status).toBe(201);

    const mediaResponse = await app.request("/listings/listing-1/media");
    expect(mediaResponse.status).toBe(200);
    const mediaPayload = await mediaResponse.json();
    expect(mediaPayload.media).toHaveLength(1);
    expect(mediaPayload.media[0].id).toBe(uploadPayload.upload.mediaId);
  });
});
