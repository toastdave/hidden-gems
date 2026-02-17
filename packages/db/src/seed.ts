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

type ListingType = "event" | "place" | "activity";

const listingTypeCycle: ListingType[] = ["event", "place", "activity"];

const listingThemes = [
  "Yard Sale",
  "Garage Sale",
  "Pop-Up Shop",
  "Vintage Market",
  "Neighborhood Swap",
  "Flea Finds",
  "Street Stall",
  "Thrift Corner",
  "Community Bazaar",
  "Curbside Market",
] as const;

const listingTitles = [
  "Morning Treasure Hunt",
  "Weekend Hidden Finds",
  "Backyard Bargain Day",
  "Porch Pop-Up",
  "Block Sale Roundup",
  "Secondhand Sunday",
  "Retro Rack Pop-In",
  "Vintage Pickers Stop",
  "Neighborhood Clearout",
  "Handmade Corner Drop",
] as const;

const listingLocations = [
  { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { name: "Portland, OR", lat: 45.5152, lng: -122.6784 },
  { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { name: "San Diego, CA", lat: 32.7157, lng: -117.1611 },
  { name: "Phoenix, AZ", lat: 33.4484, lng: -112.074 },
  { name: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  { name: "Salt Lake City, UT", lat: 40.7608, lng: -111.891 },
  { name: "Dallas, TX", lat: 32.7767, lng: -96.797 },
  { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
  { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { name: "Kansas City, MO", lat: 39.0997, lng: -94.5786 },
  { name: "Minneapolis, MN", lat: 44.9778, lng: -93.265 },
  { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
  { name: "Atlanta, GA", lat: 33.749, lng: -84.388 },
  { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { name: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
  { name: "Washington, DC", lat: 38.9072, lng: -77.0369 },
  { name: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
  { name: "New York, NY", lat: 40.7128, lng: -74.006 },
  { name: "Boston, MA", lat: 42.3601, lng: -71.0589 },
  { name: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
  { name: "New Orleans, LA", lat: 29.9511, lng: -90.0715 },
] as const;

const southeastLocations = [
  { name: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
  { name: "Raleigh, NC", lat: 35.7796, lng: -78.6382 },
  { name: "Durham, NC", lat: 35.994, lng: -78.8986 },
  { name: "Greensboro, NC", lat: 36.0726, lng: -79.792 },
  { name: "Wilmington, NC", lat: 34.2257, lng: -77.9447 },
  { name: "Columbia, SC", lat: 34.0007, lng: -81.0348 },
  { name: "Charleston, SC", lat: 32.7765, lng: -79.9311 },
  { name: "Greenville, SC", lat: 34.8526, lng: -82.394 },
  { name: "Myrtle Beach, SC", lat: 33.6891, lng: -78.8867 },
  { name: "Richmond, VA", lat: 37.5407, lng: -77.436 },
  { name: "Virginia Beach, VA", lat: 36.8529, lng: -75.978 },
  { name: "Norfolk, VA", lat: 36.8508, lng: -76.2859 },
  { name: "Charlottesville, VA", lat: 38.0293, lng: -78.4767 },
  { name: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
  { name: "Knoxville, TN", lat: 35.9606, lng: -83.9207 },
  { name: "Chattanooga, TN", lat: 35.0456, lng: -85.3097 },
  { name: "Memphis, TN", lat: 35.1495, lng: -90.049 },
] as const;

function buildFakeListings(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const i = index + 1;
    const location = listingLocations[index % listingLocations.length];
    const type = listingTypeCycle[index % listingTypeCycle.length];
    const theme = listingThemes[index % listingThemes.length];
    const title = listingTitles[(index * 3) % listingTitles.length];
    const hostNumber = (index % 4) + 1;
    const isPublished = index < 95;
    const dayOffset = (index % 21) + 1;
    const hourOffset = (index % 8) * 2;

    return {
      id: `listing-seed-${String(i).padStart(3, "0")}`,
      hostId: `host-seed-${String(hostNumber).padStart(2, "0")}`,
      createdByUserId: `user-seed-${String((index % 4) + 1).padStart(2, "0")}`,
      title: `${theme}: ${title}`,
      description:
        "Discover local hidden gems with low-cost finds, vintage pieces, handmade goods, and neighborhood-only deals.",
      type,
      status: isPublished ? "published" : "draft",
      startAt:
        type === "event"
          ? new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000)
          : null,
      timezone: type === "event" ? "America/New_York" : null,
      lat: Number((location.lat + ((index % 9) - 4) * 0.0125).toFixed(6)),
      lng: Number((location.lng + ((index % 11) - 5) * 0.014).toFixed(6)),
      locationText: location.name,
      publishedAt: isPublished ? new Date() : null,
    } as const;
  });
}

function buildRegionalListings(count: number, startId: number) {
  return Array.from({ length: count }, (_, index) => {
    const idNumber = startId + index;
    const location = southeastLocations[index % southeastLocations.length];
    const type = listingTypeCycle[index % listingTypeCycle.length];
    const theme = listingThemes[(index + 2) % listingThemes.length];
    const title = listingTitles[(index * 5) % listingTitles.length];
    const hostNumber = (index % 4) + 1;
    const isPublished = index < Math.floor(count * 0.95);
    const dayOffset = (index % 24) + 1;
    const hourOffset = (index % 10) * 2;

    return {
      id: `listing-seed-${String(idNumber).padStart(3, "0")}`,
      hostId: `host-seed-${String(hostNumber).padStart(2, "0")}`,
      createdByUserId: `user-seed-${String((index % 4) + 1).padStart(2, "0")}`,
      title: `${theme}: ${title}`,
      description:
        "Find local weekend gems including yard sales, garage clearouts, pop-up makers, and neighborhood market tables.",
      type,
      status: isPublished ? "published" : "draft",
      startAt:
        type === "event"
          ? new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000)
          : null,
      timezone: type === "event" ? "America/New_York" : null,
      lat: Number((location.lat + ((index % 7) - 3) * 0.0095).toFixed(6)),
      lng: Number((location.lng + ((index % 9) - 4) * 0.0105).toFixed(6)),
      locationText: location.name,
      publishedAt: isPublished ? new Date() : null,
    } as const;
  });
}

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

  // Seed users for listing creators
  const seedUsers = Array.from({ length: 4 }, (_, index) => {
    const i = index + 1;
    return {
      id: `user-seed-${String(i).padStart(2, "0")}`,
      email: `seed${i}@hiddengems.local`,
      displayName: `Seed User ${i}`,
    };
  });

  for (const user of seedUsers) {
    await db.insert(users).values(user).onConflictDoNothing({ target: users.id });
  }
  console.log(`  Seeded ${seedUsers.length} users`);

  // Seed hosts for listing ownership
  const seedHosts = Array.from({ length: 4 }, (_, index) => {
    const i = index + 1;
    return {
      id: `host-seed-${String(i).padStart(2, "0")}`,
      ownerUserId: `user-seed-${String(index + 1).padStart(2, "0")}`,
      type: "individual" as const,
      name: `Neighborhood Host ${i}`,
      bio: "Hosting pop-up sales, yard sales, and community hidden-gem events.",
    };
  });

  for (const host of seedHosts) {
    await db.insert(hosts).values(host).onConflictDoNothing({ target: hosts.id });
  }
  console.log(`  Seeded ${seedHosts.length} hosts`);

  // Seed 100 fake hidden-gem listings (national spread)
  const fakeListings = buildFakeListings(100);
  for (const listing of fakeListings) {
    await db
      .insert(listings)
      .values(listing)
      .onConflictDoUpdate({
        target: listings.id,
        set: {
          hostId: sql`excluded.host_id`,
          createdByUserId: sql`excluded.created_by_user_id`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          type: sql`excluded.type`,
          status: sql`excluded.status`,
          startAt: sql`excluded.start_at`,
          timezone: sql`excluded.timezone`,
          lat: sql`excluded.lat`,
          lng: sql`excluded.lng`,
          locationText: sql`excluded.location_text`,
          publishedAt: sql`excluded.published_at`,
          updatedAt: sql`now()`,
        },
      });
  }
  console.log(`  Seeded ${fakeListings.length} listings (95 published, 5 drafts)`);

  // Seed 200 additional fake hidden-gem listings focused on NC/SC/VA/TN
  const regionalListings = buildRegionalListings(200, 101);
  for (const listing of regionalListings) {
    await db
      .insert(listings)
      .values(listing)
      .onConflictDoUpdate({
        target: listings.id,
        set: {
          hostId: sql`excluded.host_id`,
          createdByUserId: sql`excluded.created_by_user_id`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          type: sql`excluded.type`,
          status: sql`excluded.status`,
          startAt: sql`excluded.start_at`,
          timezone: sql`excluded.timezone`,
          lat: sql`excluded.lat`,
          lng: sql`excluded.lng`,
          locationText: sql`excluded.location_text`,
          publishedAt: sql`excluded.published_at`,
          updatedAt: sql`now()`,
        },
      });
  }
  console.log(`  Seeded ${regionalListings.length} regional listings (190 published, 10 drafts)`);

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
