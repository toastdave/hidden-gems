import { env } from '$env/dynamic/private'
import {
	type DiscoveryFilters,
	type DiscoveryListing,
	buildDiscoveryResults,
	getDiscoveryMood,
	getDiscoveryResults,
} from '$lib/content/discovery'
import * as schema from '@hidden-gems/db/schema'
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'

type ListingRow = typeof schema.listing.$inferSelect
type HostRow = typeof schema.host.$inferSelect

function toNumber(value: string | number | null) {
	if (value === null) {
		return null
	}

	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : null
}

function toDiscoveryListing(
	listing: ListingRow,
	host: HostRow,
	tags: string[]
): DiscoveryListing | null {
	const latitude = toNumber(listing.latitude)
	const longitude = toNumber(listing.longitude)

	if (latitude === null || longitude === null) {
		return null
	}

	const normalized: DiscoveryListing = {
		id: listing.id,
		slug: listing.slug,
		title: listing.title,
		description: listing.description ?? '',
		hostName: host.displayName,
		eventType: listing.eventType,
		locationLabel: listing.locationLabel,
		city: listing.city ?? host.locationLabel ?? 'Nearby',
		region: listing.region ?? 'TX',
		latitude,
		longitude,
		priceSummary: listing.priceSummary ?? 'Free to browse',
		tags,
		isFeatured: listing.isFeatured,
		startsAt: listing.startAt.toISOString(),
		endsAt: listing.endAt?.toISOString(),
		mood: getDiscoveryMood({
			eventType: listing.eventType,
			isFeatured: listing.isFeatured,
			startsAt: listing.startAt.toISOString(),
		}),
	}

	return normalized
}

async function getPublishedListings() {
	if (!env.DATABASE_URL) {
		return null
	}

	try {
		const { db } = await import('$lib/server/db')

		const now = new Date()
		const publishedRows = await db
			.select({
				listing: schema.listing,
				host: schema.host,
			})
			.from(schema.listing)
			.innerJoin(schema.host, eq(schema.listing.hostId, schema.host.id))
			.where(
				and(
					eq(schema.listing.status, 'published'),
					gte(sql`coalesce(${schema.listing.endAt}, ${schema.listing.startAt})`, now),
					sql`${schema.listing.latitude} is not null and ${schema.listing.longitude} is not null`
				)
			)
			.orderBy(desc(schema.listing.isFeatured), schema.listing.startAt)

		if (publishedRows.length === 0) {
			return []
		}

		const listingIds = publishedRows.map(({ listing }) => listing.id)
		const tagRows = await db
			.select({
				listingId: schema.listingTag.listingId,
				tag: schema.listingTag.tag,
			})
			.from(schema.listingTag)
			.where(inArray(schema.listingTag.listingId, listingIds))

		const tagsByListingId = new Map<string, string[]>()

		for (const row of tagRows) {
			const tags = tagsByListingId.get(row.listingId) ?? []
			tags.push(row.tag)
			tagsByListingId.set(row.listingId, tags)
		}

		return publishedRows
			.map(({ listing, host }) =>
				toDiscoveryListing(listing, host, tagsByListingId.get(listing.id) ?? [])
			)
			.filter((listing): listing is DiscoveryListing => Boolean(listing))
	} catch (error) {
		console.error('Falling back to sample discovery listings', error)
		return null
	}
}

export async function getHomepageDiscoveryResults(filters: DiscoveryFilters) {
	const listings = await getPublishedListings()

	if (listings === null || listings.length === 0) {
		return getDiscoveryResults(filters)
	}

	return buildDiscoveryResults(filters, listings)
}
