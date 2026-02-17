import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hosts } from "./schema/hosts";
import { listings } from "./schema/listings";
import { plans } from "./schema/plans";
import { users } from "./schema/users";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  // Seed plans
  const seedPlans = [
    { id: "plan-free", name: "Free", slug: "free", priceMonthly: 0, maxListings: 3 },
    { id: "plan-starter", name: "Starter", slug: "starter", priceMonthly: 999, maxListings: 10 },
    { id: "plan-pro", name: "Pro", slug: "pro", priceMonthly: 2999, maxListings: 50 },
  ];

  for (const plan of seedPlans) {
    await db
      .insert(plans)
      .values(plan)
      .onConflictDoUpdate({
        target: plans.id,
        set: {
          name: sql`excluded.name`,
          priceMonthly: sql`excluded.price_monthly`,
          maxListings: sql`excluded.max_listings`,
          updatedAt: sql`now()`,
        },
      });
  }
  console.log(`  Seeded ${seedPlans.length} plans`);

  // Seed sample user
  const [sampleUser] = await db
    .insert(users)
    .values({
      id: "user-sample-01",
      email: "demo@hiddengems.local",
      displayName: "Demo User",
    })
    .onConflictDoNothing({ target: users.id })
    .returning();

  if (sampleUser) {
    console.log("  Seeded sample user");
  }

  // Seed sample host
  const [sampleHost] = await db
    .insert(hosts)
    .values({
      id: "host-sample-01",
      ownerUserId: "user-sample-01",
      type: "individual",
      name: "Demo Host",
      bio: "Local guide and hidden gem enthusiast",
    })
    .onConflictDoNothing({ target: hosts.id })
    .returning();

  if (sampleHost) {
    console.log("  Seeded sample host");
  }

  // Seed sample listings
  const sampleListings = [
    {
      id: "listing-sample-01",
      hostId: "host-sample-01",
      createdByUserId: "user-sample-01",
      title: "Secret Rooftop Garden",
      description: "A hidden garden atop a downtown building with panoramic city views.",
      type: "place" as const,
      status: "published" as const,
      lat: 40.7128,
      lng: -74.006,
      locationText: "Downtown Manhattan, NYC",
      publishedAt: new Date(),
    },
    {
      id: "listing-sample-02",
      hostId: "host-sample-01",
      createdByUserId: "user-sample-01",
      title: "Underground Jazz Night",
      description: "Intimate jazz session in a speakeasy-style basement venue.",
      type: "event" as const,
      status: "published" as const,
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      timezone: "America/New_York",
      lat: 40.7282,
      lng: -73.7949,
      locationText: "East Village, NYC",
      publishedAt: new Date(),
    },
    {
      id: "listing-sample-03",
      hostId: "host-sample-01",
      createdByUserId: "user-sample-01",
      title: "Dawn Kayak Tour",
      description: "Paddle through hidden waterways at sunrise.",
      type: "activity" as const,
      status: "draft" as const,
      lat: 40.6892,
      lng: -74.0445,
      locationText: "Brooklyn Waterfront",
    },
  ];

  for (const listing of sampleListings) {
    await db.insert(listings).values(listing).onConflictDoNothing({ target: listings.id });
  }
  console.log(`  Seeded ${sampleListings.length} listings`);

  console.log("Seeding complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
