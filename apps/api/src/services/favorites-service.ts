import { db, schema } from "@hidden-gems/db";
import { and, desc, eq } from "drizzle-orm";

export async function toggleFavorite(userId: string, listingId: string) {
  if (!listingId) {
    return { error: "listingId is required.", status: 400 as const };
  }
  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, listingId))
    .limit(1);
  if (!listing || listing.status !== "published") {
    return { error: "Listing is not available.", status: 404 as const };
  }
  const existing = await db
    .select()
    .from(schema.favorites)
    .where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.listingId, listingId)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(schema.favorites)
      .where(and(eq(schema.favorites.userId, userId), eq(schema.favorites.listingId, listingId)));
    return { favorited: false };
  }
  await db.insert(schema.favorites).values({ userId, listingId });
  return { favorited: true };
}

export async function listFavorites(userId: string) {
  const favorites = await db
    .select({
      id: schema.favorites.id,
      createdAt: schema.favorites.createdAt,
      listing: schema.listings,
    })
    .from(schema.favorites)
    .innerJoin(schema.listings, eq(schema.listings.id, schema.favorites.listingId))
    .where(and(eq(schema.favorites.userId, userId), eq(schema.listings.status, "published")))
    .orderBy(desc(schema.favorites.createdAt));
  return { favorites };
}
