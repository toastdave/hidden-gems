import { db, schema } from "@hidden-gems/db";
import { and, desc, eq } from "drizzle-orm";

export async function upsertHostForUser(userId: string, payload: Record<string, unknown>) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    return { error: "Host name must be between 2 and 80 characters.", status: 400 as const };
  }

  const [host] = await db
    .insert(schema.hosts)
    .values({
      ownerUserId: userId,
      type: "individual",
      name,
      contactEmail: typeof payload.contactEmail === "string" ? payload.contactEmail.trim() : null,
      contactPhone: typeof payload.contactPhone === "string" ? payload.contactPhone.trim() : null,
    })
    .onConflictDoUpdate({
      target: schema.hosts.ownerUserId,
      set: {
        name,
        contactEmail: typeof payload.contactEmail === "string" ? payload.contactEmail.trim() : null,
        contactPhone: typeof payload.contactPhone === "string" ? payload.contactPhone.trim() : null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return { host };
}

export async function getPublicHost(hostId: string) {
  const [host] = await db.select().from(schema.hosts).where(eq(schema.hosts.id, hostId)).limit(1);
  if (!host) {
    return { error: "Host not found.", status: 404 as const };
  }
  const listings = await db
    .select()
    .from(schema.listings)
    .where(and(eq(schema.listings.hostId, host.id), eq(schema.listings.status, "published")))
    .orderBy(desc(schema.listings.publishedAt));
  return { host, listings };
}
