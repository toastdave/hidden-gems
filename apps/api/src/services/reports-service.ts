import { db, schema } from "@hidden-gems/db";
import { desc, eq } from "drizzle-orm";

export async function submitReport(userId: string, payload: Record<string, unknown>) {
  const listingId = typeof payload.listingId === "string" ? payload.listingId : "";
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  const details = typeof payload.details === "string" ? payload.details.trim() : null;
  if (!listingId || !reason) {
    return { error: "listingId and reason are required.", status: 400 as const };
  }
  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);
  if (!listing) {
    return { error: "Listing not found.", status: 404 as const };
  }
  const [report] = await db
    .insert(schema.reports)
    .values({
      listingId,
      reporterUserId: userId,
      reason,
      details,
      status: "open",
    })
    .returning();
  return { report, status: 201 as const };
}

export async function listReports() {
  const reports = await db
    .select({
      report: schema.reports,
      listing: schema.listings,
      reporter: schema.users,
    })
    .from(schema.reports)
    .innerJoin(schema.listings, eq(schema.listings.id, schema.reports.listingId))
    .innerJoin(schema.users, eq(schema.users.id, schema.reports.reporterUserId))
    .orderBy(desc(schema.reports.createdAt));
  return { reports };
}

export async function updateReportStatus(reportId: string, payload: Record<string, unknown>) {
  const status = payload.status === "reviewed" ? "reviewed" : "open";
  const [updated] = await db
    .update(schema.reports)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.reports.id, reportId))
    .returning();
  if (!updated) {
    return { error: "Report not found.", status: 404 as const };
  }
  return { report: updated };
}
