import { db } from '$lib/server/db'
import * as schema from '@hidden-gems/db/schema'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'

type ListingRecord = typeof schema.listing.$inferSelect
type HostRecord = typeof schema.host.$inferSelect
type MediaRecord = typeof schema.media.$inferSelect

export type FavoriteListingSummary = {
	savedAt: Date
	listing: ListingRecord
	host: HostRecord
	tags: string[]
	coverMedia: MediaRecord | null
}

export type FollowedHostSummary = {
	followedAt: Date
	host: HostRecord
	publishedListingsCount: number
	nextListing: ListingRecord | null
}

export async function getFavoritedListingIds(userId: string, listingIds: string[]) {
	if (listingIds.length === 0) {
		return []
	}

	const rows = await db
		.select({ listingId: schema.favorite.listingId })
		.from(schema.favorite)
		.where(and(eq(schema.favorite.userId, userId), inArray(schema.favorite.listingId, listingIds)))

	return rows.map((row) => row.listingId)
}

export async function getFollowedHostIds(userId: string, hostIds: string[]) {
	if (hostIds.length === 0) {
		return []
	}

	const rows = await db
		.select({ hostId: schema.follow.hostId })
		.from(schema.follow)
		.where(and(eq(schema.follow.userId, userId), inArray(schema.follow.hostId, hostIds)))

	return rows.map((row) => row.hostId)
}

export async function canFavoriteListing(listingId: string) {
	const rows = await db
		.select({ id: schema.listing.id })
		.from(schema.listing)
		.where(and(eq(schema.listing.id, listingId), eq(schema.listing.status, 'published')))
		.limit(1)

	return Boolean(rows[0])
}

export async function canFollowHost(hostId: string) {
	const rows = await db
		.select({ id: schema.host.id })
		.from(schema.host)
		.where(eq(schema.host.id, hostId))
		.limit(1)

	return Boolean(rows[0])
}

export async function addFavoriteListing(userId: string, listingId: string) {
	await db.insert(schema.favorite).values({ userId, listingId }).onConflictDoNothing()
}

export async function removeFavoriteListing(userId: string, listingId: string) {
	await db
		.delete(schema.favorite)
		.where(and(eq(schema.favorite.userId, userId), eq(schema.favorite.listingId, listingId)))
}

export async function addFollowHost(userId: string, hostId: string) {
	await db.insert(schema.follow).values({ userId, hostId }).onConflictDoNothing()
}

export async function removeFollowHost(userId: string, hostId: string) {
	await db
		.delete(schema.follow)
		.where(and(eq(schema.follow.userId, userId), eq(schema.follow.hostId, hostId)))
}

export async function getFavoriteListingsForUser(
	userId: string
): Promise<FavoriteListingSummary[]> {
	const rows = await db
		.select({
			favorite: schema.favorite,
			listing: schema.listing,
			host: schema.host,
		})
		.from(schema.favorite)
		.innerJoin(schema.listing, eq(schema.favorite.listingId, schema.listing.id))
		.innerJoin(schema.host, eq(schema.listing.hostId, schema.host.id))
		.where(and(eq(schema.favorite.userId, userId), eq(schema.listing.status, 'published')))
		.orderBy(asc(schema.listing.startAt), desc(schema.favorite.createdAt))

	const listingIds = rows.map(({ listing }) => listing.id)

	if (listingIds.length === 0) {
		return []
	}

	const [tagRows, mediaRows] = await Promise.all([
		db
			.select({ listingId: schema.listingTag.listingId, tag: schema.listingTag.tag })
			.from(schema.listingTag)
			.where(inArray(schema.listingTag.listingId, listingIds))
			.orderBy(asc(schema.listingTag.tag)),
		db
			.select()
			.from(schema.media)
			.where(inArray(schema.media.listingId, listingIds))
			.orderBy(asc(schema.media.sortOrder), asc(schema.media.createdAt)),
	])

	const tagsByListingId = new Map<string, string[]>()
	const coverMediaByListingId = new Map<string, MediaRecord>()

	for (const row of tagRows) {
		const tags = tagsByListingId.get(row.listingId) ?? []
		tags.push(row.tag)
		tagsByListingId.set(row.listingId, tags)
	}

	for (const media of mediaRows) {
		if (!coverMediaByListingId.has(media.listingId)) {
			coverMediaByListingId.set(media.listingId, media)
		}
	}

	return rows.map(({ favorite, listing, host }) => ({
		savedAt: favorite.createdAt,
		listing,
		host,
		tags: tagsByListingId.get(listing.id) ?? [],
		coverMedia: coverMediaByListingId.get(listing.id) ?? null,
	}))
}

export async function getFollowedHostsForUser(userId: string): Promise<FollowedHostSummary[]> {
	const rows = await db
		.select({
			follow: schema.follow,
			host: schema.host,
		})
		.from(schema.follow)
		.innerJoin(schema.host, eq(schema.follow.hostId, schema.host.id))
		.where(eq(schema.follow.userId, userId))
		.orderBy(desc(schema.follow.createdAt))

	const hostIds = rows.map(({ host }) => host.id)

	if (hostIds.length === 0) {
		return []
	}

	const listings = await db
		.select()
		.from(schema.listing)
		.where(and(inArray(schema.listing.hostId, hostIds), eq(schema.listing.status, 'published')))
		.orderBy(asc(schema.listing.startAt))

	const listingsByHostId = new Map<string, ListingRecord[]>()

	for (const listing of listings) {
		const items = listingsByHostId.get(listing.hostId) ?? []
		items.push(listing)
		listingsByHostId.set(listing.hostId, items)
	}

	return rows.map(({ follow, host }) => {
		const hostListings = listingsByHostId.get(host.id) ?? []

		return {
			followedAt: follow.createdAt,
			host,
			publishedListingsCount: hostListings.length,
			nextListing: hostListings[0] ?? null,
		}
	})
}
