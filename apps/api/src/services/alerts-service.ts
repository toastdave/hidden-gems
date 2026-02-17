import { db, schema } from "@hidden-gems/db";
import { desc, eq } from "drizzle-orm";

export async function createAlert(userId: string, payload: Record<string, unknown>) {
  const radiusKm = Number(payload.radiusKm);
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 500) {
    return { error: "radiusKm must be between 1 and 500.", status: 400 as const };
  }
  const filters =
    payload.filters && typeof payload.filters === "object"
      ? (payload.filters as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const [alert] = await db
    .insert(schema.savedAlerts)
    .values({
      userId,
      radiusKm: Math.round(radiusKm),
      filters,
      enabled: true,
    })
    .returning();
  return { alert, status: 201 as const };
}

export async function toggleAlert(
  userId: string,
  alertId: string,
  payload: Record<string, unknown>,
) {
  const [alert] = await db
    .select()
    .from(schema.savedAlerts)
    .where(eq(schema.savedAlerts.id, alertId))
    .limit(1);
  if (!alert) {
    return { error: "Alert not found.", status: 404 as const };
  }
  if (alert.userId !== userId) {
    return { error: "Forbidden.", status: 403 as const };
  }
  const enabled = Boolean(payload.enabled);
  const [updated] = await db
    .update(schema.savedAlerts)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(schema.savedAlerts.id, alertId))
    .returning();
  return { alert: updated };
}

export async function listAlerts(userId: string) {
  const alerts = await db
    .select()
    .from(schema.savedAlerts)
    .where(eq(schema.savedAlerts.userId, userId))
    .orderBy(desc(schema.savedAlerts.createdAt));
  return { alerts };
}

export async function runAlertsWorker() {
  const enabledAlerts = await db
    .select()
    .from(schema.savedAlerts)
    .where(eq(schema.savedAlerts.enabled, true))
    .limit(200);
  const listingCandidates = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.status, "published"))
    .orderBy(desc(schema.listings.publishedAt))
    .limit(500);
  const matchSummary = enabledAlerts.map((alert) => {
    const listingType = typeof alert.filters?.type === "string" ? alert.filters.type : null;
    const matches = listingCandidates.filter((listing) => {
      if (listingType && listing.type !== listingType) {
        return false;
      }
      return true;
    });
    return { alertId: alert.id, matchCount: matches.length };
  });
  return { processed: enabledAlerts.length, matchSummary };
}
