import { db, schema } from "@hidden-gems/db";
import { eq } from "drizzle-orm";

export async function updateHomeLocation(userId: string, lat: number, lng: number) {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: "Invalid coordinates.", status: 400 as const };
  }

  const [updated] = await db
    .update(schema.users)
    .set({
      homeLat: lat,
      homeLng: lng,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))
    .returning({
      id: schema.users.id,
      homeLat: schema.users.homeLat,
      homeLng: schema.users.homeLng,
    });

  if (!updated) {
    return { error: "User not found.", status: 404 as const };
  }

  return { location: updated };
}

export async function getHomeLocation(userId: string) {
  const [user] = await db
    .select({
      homeLat: schema.users.homeLat,
      homeLng: schema.users.homeLng,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  return {
    homeLat: user?.homeLat ?? null,
    homeLng: user?.homeLng ?? null,
  };
}
