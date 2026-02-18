import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { hostsRoutes } from "./hosts-routes";
import { listingsRoutes } from "./listings-routes";
import { userRoutes } from "./user-routes";

function buildApp() {
  const app = new Hono();
  app.route("/", hostsRoutes);
  app.route("/", listingsRoutes);
  app.route("/", userRoutes);
  return app;
}

describe("protected routes", () => {
  test("anonymous host create fails with 401", async () => {
    const app = buildApp();

    const response = await app.request("/hosts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "My Host" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
  });

  test("anonymous listing draft create fails with 401", async () => {
    const app = buildApp();

    const response = await app.request("/listings/drafts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostId: "host-1", title: "Title", type: "event" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
  });

  test("anonymous media upload URL request fails with 401", async () => {
    const app = buildApp();

    const response = await app.request("/listings/listing-1/media/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "photo.jpg",
        contentType: "image/jpeg",
        sizeBytes: 1024,
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
  });

  test("anonymous profile patch fails with 401", async () => {
    const app = buildApp();

    const response = await app.request("/users/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Updated Name" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
  });
});
