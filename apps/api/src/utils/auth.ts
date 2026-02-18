import type { schema } from "@hidden-gems/db";
import type { ApiUser } from "../types/api";

export function sanitizeUser(user: typeof schema.users.$inferSelect): ApiUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export function isAdmin(email: string) {
  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(email.toLowerCase());
}

export function listHasPremiumAccess(slug: string | null | undefined) {
  return slug === "starter" || slug === "pro" || slug === "viewer-plus" || slug === "creator-pro";
}
