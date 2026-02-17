import { db, schema } from "@hidden-gems/db";
import type { MiddlewareHandler } from "hono";
import { auth } from "../auth";
import type { ApiEnv } from "../types/api";
import { sanitizeUser } from "../utils/auth";

export const sessionContextMiddleware: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!sessionData?.user) {
    c.set("user", null);
    await next();
    return;
  }

  const [appUser] = await db
    .insert(schema.users)
    .values({
      id: sessionData.user.id,
      email: sessionData.user.email,
      displayName: sessionData.user.name ?? null,
      avatarUrl: sessionData.user.image ?? null,
      emailVerifiedAt: sessionData.user.emailVerified ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: sessionData.user.email,
        displayName: sessionData.user.name ?? null,
        avatarUrl: sessionData.user.image ?? null,
        emailVerifiedAt: sessionData.user.emailVerified ? new Date() : null,
        updatedAt: new Date(),
      },
    })
    .returning();

  c.set("user", sanitizeUser(appUser));
  await next();
};
