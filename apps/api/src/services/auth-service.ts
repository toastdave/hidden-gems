import { db, schema } from "@hidden-gems/db";
import { and, desc, eq } from "drizzle-orm";
import type { ApiUser } from "../types/api";
import { isAdmin } from "../utils/auth";

export async function getCurrentUserState(user: ApiUser) {
  const entitlement = await db
    .select({
      planSlug: schema.plans.slug,
      active: schema.userEntitlements.active,
    })
    .from(schema.userEntitlements)
    .innerJoin(schema.plans, eq(schema.plans.id, schema.userEntitlements.planId))
    .where(
      and(eq(schema.userEntitlements.userId, user.id), eq(schema.userEntitlements.active, true)),
    )
    .orderBy(desc(schema.userEntitlements.startsAt))
    .limit(1);

  return {
    user,
    isAdmin: isAdmin(user.email),
    planSlug: entitlement[0]?.planSlug ?? "free",
  };
}
