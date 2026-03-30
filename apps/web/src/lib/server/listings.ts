import { db } from '$lib/server/db'
import * as schema from '@hidden-gems/db/schema'
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm'

export type HostListingRecord = typeof schema.listing.$inferSelect
export type ListingMediaRecord = typeof schema.media.$inferSelect

export type ListingEditorValues = {
	title: string
	slug: string
	description: string
	eventType: string
	status: 'draft' | 'published'
	startAt: string
	endAt: string
	timezone: string
	locationLabel: string
	addressLine1: string
	addressLine2: string
	city: string
	region: string
	postalCode: string
	countryCode: string
	latitude: string
	longitude: string
	priceSummary: string
	tags: string
	isFeatured: boolean
}

export type ListingFormErrors = Partial<Record<keyof ListingEditorValues | 'form', string>>

export function slugifyListingTitle(value: string) {
	return value
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
}

export function splitListingTags(value: string) {
	return [
		...new Set(
			value
				.split(',')
				.map((tag) => tag.trim())
				.filter(Boolean)
		),
	].slice(0, 8)
}

export function defaultListingValues(): ListingEditorValues {
	return {
		title: '',
		slug: '',
		description: '',
		eventType: 'yard_sale',
		status: 'draft',
		startAt: '',
		endAt: '',
		timezone: 'America/Chicago',
		locationLabel: '',
		addressLine1: '',
		addressLine2: '',
		city: '',
		region: '',
		postalCode: '',
		countryCode: 'US',
		latitude: '',
		longitude: '',
		priceSummary: '',
		tags: '',
		isFeatured: false,
	}
}

function toLocalDateTimeInput(value: Date | null) {
	if (!value) {
		return ''
	}

	const offsetDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
	return offsetDate.toISOString().slice(0, 16)
}

export async function getListingForHost(hostId: string, listingId: string) {
	const rows = await db
		.select()
		.from(schema.listing)
		.where(and(eq(schema.listing.id, listingId), eq(schema.listing.hostId, hostId)))
		.limit(1)

	return rows[0] ?? null
}

export async function getListingTags(listingId: string) {
	const rows = await db
		.select({ tag: schema.listingTag.tag })
		.from(schema.listingTag)
		.where(eq(schema.listingTag.listingId, listingId))
		.orderBy(schema.listingTag.tag)

	return rows.map((row) => row.tag)
}

export async function getRecentListingsForHost(hostId: string) {
	return db
		.select()
		.from(schema.listing)
		.where(eq(schema.listing.hostId, hostId))
		.orderBy(desc(schema.listing.isFeatured), desc(schema.listing.startAt))
}

export function listingToValues(listing: HostListingRecord, tags: string[]): ListingEditorValues {
	return {
		title: listing.title,
		slug: listing.slug,
		description: listing.description ?? '',
		eventType: listing.eventType,
		status: listing.status === 'published' ? 'published' : 'draft',
		startAt: toLocalDateTimeInput(listing.startAt),
		endAt: toLocalDateTimeInput(listing.endAt ?? null),
		timezone: listing.timezone,
		locationLabel: listing.locationLabel,
		addressLine1: listing.addressLine1 ?? '',
		addressLine2: listing.addressLine2 ?? '',
		city: listing.city ?? '',
		region: listing.region ?? '',
		postalCode: listing.postalCode ?? '',
		countryCode: listing.countryCode,
		latitude: listing.latitude?.toString() ?? '',
		longitude: listing.longitude?.toString() ?? '',
		priceSummary: listing.priceSummary ?? '',
		tags: tags.join(', '),
		isFeatured: listing.isFeatured,
	}
}

export async function ensureListingSlugAvailable(slug: string, listingId?: string) {
	const conditions = listingId
		? and(eq(schema.listing.slug, slug), ne(schema.listing.id, listingId))
		: eq(schema.listing.slug, slug)

	const rows = await db
		.select({ id: schema.listing.id })
		.from(schema.listing)
		.where(conditions)
		.limit(1)

	return rows.length === 0
}

export async function getListingMedia(listingId: string) {
	return db
		.select()
		.from(schema.media)
		.where(eq(schema.media.listingId, listingId))
		.orderBy(asc(schema.media.sortOrder), asc(schema.media.createdAt))
}

export async function getMediaById(mediaId: string) {
	const rows = await db.select().from(schema.media).where(eq(schema.media.id, mediaId)).limit(1)

	return rows[0] ?? null
}

export async function addListingMedia(input: {
	id: string
	listingId: string
	objectKey: string
	url: string
	altText?: string | null
	width?: number | null
	height?: number | null
}) {
	const existingMedia = await getListingMedia(input.listingId)

	const [media] = await db
		.insert(schema.media)
		.values({
			id: input.id,
			listingId: input.listingId,
			objectKey: input.objectKey,
			url: input.url,
			altText: input.altText ?? null,
			sortOrder: existingMedia.length,
			width: input.width ?? null,
			height: input.height ?? null,
		})
		.returning()

	return media
}

export async function setCoverMedia(listingId: string, mediaId: string) {
	const media = await getListingMedia(listingId)
	const ordered = [
		...media.filter((item) => item.id === mediaId),
		...media.filter((item) => item.id !== mediaId),
	]

	await Promise.all(
		ordered.map((item, index) =>
			db.update(schema.media).set({ sortOrder: index }).where(eq(schema.media.id, item.id))
		)
	)

	return ordered
}

export async function deleteMediaRecord(mediaId: string) {
	const media = await getMediaById(mediaId)

	if (!media) {
		return null
	}

	await db.delete(schema.media).where(eq(schema.media.id, mediaId))

	const remainingMedia = await getListingMedia(media.listingId)

	await Promise.all(
		remainingMedia.map((item, index) =>
			db.update(schema.media).set({ sortOrder: index }).where(eq(schema.media.id, item.id))
		)
	)

	return media
}

export async function getListingBySlug(slug: string) {
	const rows = await db
		.select({
			listing: schema.listing,
			host: schema.host,
		})
		.from(schema.listing)
		.innerJoin(schema.host, eq(schema.listing.hostId, schema.host.id))
		.where(and(eq(schema.listing.slug, slug), eq(schema.listing.status, 'published')))
		.limit(1)

	return rows[0] ?? null
}

export async function getPublicListingTags(listingId: string) {
	return getListingTags(listingId)
}

export async function getPublicListingMedia(listingId: string) {
	return getListingMedia(listingId)
}

export async function getRelatedPublishedListings(
	listingId: string,
	city: string | null,
	hostId: string
) {
	const rows = await db
		.select({
			listing: schema.listing,
			host: schema.host,
		})
		.from(schema.listing)
		.innerJoin(schema.host, eq(schema.listing.hostId, schema.host.id))
		.where(
			and(
				eq(schema.listing.status, 'published'),
				ne(schema.listing.id, listingId),
				city ? eq(schema.listing.city, city) : sql`true`
			)
		)
		.orderBy(desc(schema.listing.isFeatured), desc(schema.listing.startAt))
		.limit(4)

	const relatedIds = rows.map(({ listing }) => listing.id)
	const tagRows = relatedIds.length
		? await db
				.select({ listingId: schema.listingTag.listingId, tag: schema.listingTag.tag })
				.from(schema.listingTag)
				.where(inArray(schema.listingTag.listingId, relatedIds))
		: []
	const mediaRows = relatedIds.length
		? await db
				.select()
				.from(schema.media)
				.where(inArray(schema.media.listingId, relatedIds))
				.orderBy(asc(schema.media.sortOrder), asc(schema.media.createdAt))
		: []

	const tagsByListingId = new Map<string, string[]>()
	const mediaByListingId = new Map<string, ListingMediaRecord[]>()

	for (const row of tagRows) {
		const tags = tagsByListingId.get(row.listingId) ?? []
		tags.push(row.tag)
		tagsByListingId.set(row.listingId, tags)
	}

	for (const media of mediaRows) {
		const items = mediaByListingId.get(media.listingId) ?? []
		items.push(media)
		mediaByListingId.set(media.listingId, items)
	}

	return rows.map(({ listing, host }) => ({
		listing,
		host,
		tags: tagsByListingId.get(listing.id) ?? [],
		media: mediaByListingId.get(listing.id) ?? [],
		isSameHost: listing.hostId === hostId,
	}))
}
