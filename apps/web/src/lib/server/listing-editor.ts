import { db } from '$lib/server/db'
import {
	type ListingEditorValues,
	type ListingFormErrors,
	defaultListingValues,
	ensureListingSlugAvailable,
	slugifyListingTitle,
	splitListingTags,
} from '$lib/server/listings'
import * as schema from '@hidden-gems/db/schema'
import { eq } from 'drizzle-orm'

const eventTypes = new Set([
	'yard_sale',
	'garage_sale',
	'estate_sale',
	'flea_market',
	'pop_up_market',
	'community_sale',
	'other',
])

function parseDateTime(value: string) {
	if (!value) {
		return null
	}

	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

function parseCoordinate(value: string) {
	if (!value.trim()) {
		return null
	}

	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function getListingValuesFromForm(formData: FormData): ListingEditorValues {
	const defaults = defaultListingValues()
	const title = String(formData.get('title') ?? '').trim()
	const submittedSlug = String(formData.get('slug') ?? '').trim()
	const intent = formData.get('intent') === 'publish' ? 'published' : 'draft'

	return {
		...defaults,
		title,
		slug: slugifyListingTitle(submittedSlug || title),
		description: String(formData.get('description') ?? '').trim(),
		eventType: String(formData.get('eventType') ?? defaults.eventType),
		status: intent,
		startAt: String(formData.get('startAt') ?? ''),
		endAt: String(formData.get('endAt') ?? ''),
		timezone: String(formData.get('timezone') ?? defaults.timezone).trim() || defaults.timezone,
		locationLabel: String(formData.get('locationLabel') ?? '').trim(),
		addressLine1: String(formData.get('addressLine1') ?? '').trim(),
		addressLine2: String(formData.get('addressLine2') ?? '').trim(),
		city: String(formData.get('city') ?? '').trim(),
		region: String(formData.get('region') ?? '').trim(),
		postalCode: String(formData.get('postalCode') ?? '').trim(),
		countryCode:
			String(formData.get('countryCode') ?? defaults.countryCode).trim() || defaults.countryCode,
		latitude: String(formData.get('latitude') ?? '').trim(),
		longitude: String(formData.get('longitude') ?? '').trim(),
		priceSummary: String(formData.get('priceSummary') ?? '').trim(),
		tags: String(formData.get('tags') ?? '').trim(),
		isFeatured: formData.get('isFeatured') === 'on',
	}
}

export async function validateListingValues(
	values: ListingEditorValues,
	listingId?: string
): Promise<ListingFormErrors> {
	const errors: ListingFormErrors = {}
	const startAt = parseDateTime(values.startAt)
	const endAt = parseDateTime(values.endAt)
	const latitude = parseCoordinate(values.latitude)
	const longitude = parseCoordinate(values.longitude)

	if (values.title.length < 4) {
		errors.title = 'Use a title with at least 4 characters.'
	}

	if (!values.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
		errors.slug = 'Use lowercase letters, numbers, and dashes only.'
	}

	if (values.slug.length > 80) {
		errors.slug = 'Keep the listing link under 80 characters.'
	}

	if (!eventTypes.has(values.eventType)) {
		errors.eventType = 'Choose a valid event type.'
	}

	if (!startAt) {
		errors.startAt = 'Choose a valid start date and time.'
	}

	if (values.endAt && !endAt) {
		errors.endAt = 'Use a valid end date and time or leave it blank.'
	}

	if (startAt && endAt && endAt.getTime() <= startAt.getTime()) {
		errors.endAt = 'End time should be later than the start time.'
	}

	if (!values.locationLabel) {
		errors.locationLabel = 'Add a neighborhood, venue, or stop description.'
	}

	if (!values.city) {
		errors.city = 'Add the city so discovery results feel trustworthy.'
	}

	if (!values.region) {
		errors.region = 'Add the state or region.'
	}

	if (values.status === 'published' && values.description.trim().length < 20) {
		errors.description = 'Add a little more detail before publishing.'
	}

	if (
		!values.latitude ||
		Number.isNaN(latitude) ||
		latitude === null ||
		latitude < -90 ||
		latitude > 90
	) {
		errors.latitude = 'Use a valid latitude between -90 and 90.'
	}

	if (
		!values.longitude ||
		Number.isNaN(longitude) ||
		longitude === null ||
		longitude < -180 ||
		longitude > 180
	) {
		errors.longitude = 'Use a valid longitude between -180 and 180.'
	}

	if (!(await ensureListingSlugAvailable(values.slug, listingId))) {
		errors.slug = 'That listing link is already taken.'
	}

	return errors
}

export async function saveListing(options: {
	hostId: string
	listingId?: string
	values: ListingEditorValues
	existingPublishedAt?: Date | null
}) {
	const startAt = new Date(options.values.startAt)
	const endAt = options.values.endAt ? new Date(options.values.endAt) : null
	const publishedAt =
		options.values.status === 'published' ? (options.existingPublishedAt ?? new Date()) : null

	const payload = {
		hostId: options.hostId,
		slug: options.values.slug,
		title: options.values.title,
		description: options.values.description || null,
		eventType: options.values.eventType as typeof schema.listing.$inferInsert.eventType,
		status: options.values.status,
		startAt,
		endAt,
		timezone: options.values.timezone,
		locationLabel: options.values.locationLabel,
		addressLine1: options.values.addressLine1 || null,
		addressLine2: options.values.addressLine2 || null,
		city: options.values.city || null,
		region: options.values.region || null,
		postalCode: options.values.postalCode || null,
		countryCode: options.values.countryCode,
		latitude: options.values.latitude,
		longitude: options.values.longitude,
		priceSummary: options.values.priceSummary || null,
		isFeatured: options.values.isFeatured,
		publishedAt,
	}

	const tags = splitListingTags(options.values.tags)

	const [savedListing] = options.listingId
		? await db
				.update(schema.listing)
				.set(payload)
				.where(eq(schema.listing.id, options.listingId))
				.returning()
		: await db.insert(schema.listing).values(payload).returning()

	await db.delete(schema.listingTag).where(eq(schema.listingTag.listingId, savedListing.id))

	if (tags.length > 0) {
		await db
			.insert(schema.listingTag)
			.values(tags.map((tag) => ({ listingId: savedListing.id, tag })))
	}

	return savedListing
}
