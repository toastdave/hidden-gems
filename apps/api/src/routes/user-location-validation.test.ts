import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { userRoutes } from "./user-routes";

describe("user location validation", () => {
  test("rejects malformed coordinates with 400", async () => {
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

    app.route("/", userRoutes);

    const response = await app.request("/users/me/location", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lat: "abc", lng: 20 }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "lat and lng are required numbers." });
  });
});
