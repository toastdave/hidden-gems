import { env } from '$env/dynamic/private'
import {
	type DiscoveryCenterOverride,
	type DiscoveryFilters,
	type DiscoveryListing,
	buildDiscoveryResults,
	getDiscoveryMood,
	getDiscoveryResults,
} from '$lib/content/discovery'
import { geocodeSearchQuery } from '$lib/server/geocoding'
import * as schema from '@hidden-gems/db/schema'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

type ListingRow = typeof schema.listing.$inferSelect
type HostRow = typeof schema.host.$inferSelect
type MediaRow = typeof schema.media.$inferSelect

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
	tags: string[],
	coverMedia?: MediaRow
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
		coverImageUrl: coverMedia?.url ?? undefined,
		coverImageAlt: coverMedia?.altText ?? listing.title,
		hostName: host.displayName,
		hostSlug: host.slug,
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

export async function getPublishedDiscoveryListings() {
	if (!env.DATABASE_URL) {
		return null
	}

	try {
		const { db } = await import('$lib/server/db')

		const now = new Date()
		const nowIso = now.toISOString()
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
					sql`coalesce(${schema.listing.endAt}, ${schema.listing.startAt}) >= ${nowIso}::timestamptz`,
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
		const mediaRows = await db
			.select()
			.from(schema.media)
			.where(inArray(schema.media.listingId, listingIds))
			.orderBy(asc(schema.media.sortOrder), asc(schema.media.createdAt))
		const coverMediaByListingId = new Map<string, MediaRow>()

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

		return publishedRows
			.map(({ listing, host }) =>
				toDiscoveryListing(
					listing,
					host,
					tagsByListingId.get(listing.id) ?? [],
					coverMediaByListingId.get(listing.id)
				)
			)
			.filter((listing): listing is DiscoveryListing => Boolean(listing))
	} catch (error) {
		console.error('Falling back to sample discovery listings', error)
		return null
	}
}

function getCoordinate(value: string | null | undefined, bounds: { min: number; max: number }) {
	if (!value?.trim()) {
		return null
	}

	const parsed = Number(value)

	if (!Number.isFinite(parsed) || parsed < bounds.min || parsed > bounds.max) {
		return null
	}

	return parsed
}

async function resolveDiscoveryCenterOverride(filters: DiscoveryFilters): Promise<{
	centerOverride: DiscoveryCenterOverride | null
	locationError: string | null
}> {
	const latitude = getCoordinate(filters.lat, { min: -90, max: 90 })
	const longitude = getCoordinate(filters.lng, { min: -180, max: 180 })
	const place = filters.place?.trim() ?? ''

	if (latitude !== null && longitude !== null) {
		return {
			centerOverride: {
				label: place || 'Current location',
				latitude,
				longitude,
				zoom: 11.8,
				description: place
					? 'Showing results around your searched location.'
					: 'Showing results around your current location.',
			},
			locationError: null,
		}
	}

	if (!place) {
		return {
			centerOverride: null,
			locationError: null,
		}
	}

	const geocoded = await geocodeSearchQuery(place, {
		autocomplete: false,
		countryCode: 'US',
	})

	if (!geocoded.ok) {
		return {
			centerOverride: null,
			locationError: geocoded.message,
		}
	}

	return {
		centerOverride: {
			label: geocoded.result.label,
			latitude: geocoded.result.latitude,
			longitude: geocoded.result.longitude,
			zoom: 11.8,
			description: 'Showing results around your searched location.',
		},
		locationError: null,
	}
}

export async function getHomepageDiscoveryResults(filters: DiscoveryFilters) {
	const { centerOverride, locationError } = await resolveDiscoveryCenterOverride(filters)
	const listings = await getPublishedDiscoveryListings()

	if (listings === null || listings.length === 0) {
		return {
			...getDiscoveryResults(filters, centerOverride),
			locationError,
		}
	}

	return {
		...buildDiscoveryResults(filters, listings, new Date(), centerOverride),
		locationError,
	}
}
