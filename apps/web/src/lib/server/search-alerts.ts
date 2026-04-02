import {
	type NotificationCadence,
	buildSavedSearchNotificationBody,
	buildSavedSearchNotificationTitle,
	isSearchAlertDue,
} from '$lib/alerts'
import {
	type DiscoveryEventType,
	type DiscoveryListing,
	buildDiscoveryResults,
	eventTypeOptions,
	formatTagLabel,
	getDiscoveryMood,
	getEventTypeLabel,
	radiusOptions,
} from '$lib/content/discovery'
import { db } from '$lib/server/db'
import * as schema from '@hidden-gems/db/schema'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

export type SearchAlertRecord = typeof schema.searchAlert.$inferSelect
export type NotificationPreferenceRecord = typeof schema.notificationPreference.$inferSelect
export type AlertNotificationRecord = typeof schema.notification.$inferSelect

export type NotificationPreferenceSettings = {
	searchAlertsEnabled: boolean
	searchAlertCadence: NotificationCadence
}

export type SearchAlertInput = {
	locationLabel: string
	latitude: number | null
	longitude: number | null
	radiusMiles: number
	eventTypes: DiscoveryEventType[]
	tags: string[]
}

export type SavedSearchAlertDeliverySummary = {
	activeAlerts: number
	checkedAlerts: number
	createdNotifications: number
	deliveredListings: number
	skippedAlerts: number
}

export const defaultNotificationPreference: NotificationPreferenceSettings = {
	searchAlertsEnabled: true,
	searchAlertCadence: 'daily',
}

type ListingRow = typeof schema.listing.$inferSelect
type HostRow = typeof schema.host.$inferSelect
type MediaRow = typeof schema.media.$inferSelect

const allowedEventTypes = new Set(
	eventTypeOptions
		.map((option) => option.value)
		.filter((value): value is DiscoveryEventType => value !== 'all')
)

function uniqueSorted(values: string[]) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

export function isValidSearchAlertEventType(value: string): value is DiscoveryEventType {
	return allowedEventTypes.has(value as DiscoveryEventType)
}

export function isValidNotificationCadence(value: string): value is NotificationCadence {
	return value === 'instant' || value === 'daily'
}

function normalizeEventTypes(eventTypes: string[]): DiscoveryEventType[] {
	return uniqueSorted(
		eventTypes.filter((eventType): eventType is DiscoveryEventType =>
			isValidSearchAlertEventType(eventType)
		)
	) as DiscoveryEventType[]
}

function normalizeTags(tags: string[]) {
	return uniqueSorted(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))
}

function arraysEqual(left: string[], right: string[]) {
	return left.length === right.length && left.every((value, index) => value === right[index])
}

function toNullableNumericString(value: number | null) {
	return value === null ? null : String(value)
}

function toNullableNumber(value: string | number | null) {
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
	const latitude = toNullableNumber(listing.latitude)
	const longitude = toNullableNumber(listing.longitude)

	if (latitude === null || longitude === null) {
		return null
	}

	return {
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
}

async function getDeliverableDiscoveryListings(now = new Date()) {
	try {
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
		const [tagRows, mediaRows] = await Promise.all([
			db
				.select({
					listingId: schema.listingTag.listingId,
					tag: schema.listingTag.tag,
				})
				.from(schema.listingTag)
				.where(inArray(schema.listingTag.listingId, listingIds)),
			db
				.select()
				.from(schema.media)
				.where(inArray(schema.media.listingId, listingIds))
				.orderBy(asc(schema.media.sortOrder), asc(schema.media.createdAt)),
		])

		const tagsByListingId = new Map<string, string[]>()
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
		console.error('Unable to load published listings for saved-search delivery', error)
		return []
	}
}

function resolveNotificationPreference(
	preference: NotificationPreferenceRecord | null | undefined
): NotificationPreferenceSettings {
	return {
		searchAlertsEnabled:
			preference?.searchAlertsEnabled ?? defaultNotificationPreference.searchAlertsEnabled,
		searchAlertCadence:
			(preference?.searchAlertCadence as NotificationCadence | undefined) ??
			defaultNotificationPreference.searchAlertCadence,
	}
}

export function isValidSearchAlertRadius(value: number) {
	return radiusOptions.includes(value)
}

export function normalizeSearchAlertInput(input: SearchAlertInput): SearchAlertInput {
	return {
		locationLabel: input.locationLabel.trim(),
		latitude: input.latitude,
		longitude: input.longitude,
		radiusMiles: input.radiusMiles,
		eventTypes: normalizeEventTypes(input.eventTypes),
		tags: normalizeTags(input.tags),
	}
}

export function buildSearchAlertLabel(input: SearchAlertInput) {
	const parts = [
		input.locationLabel,
		`Within ${input.radiusMiles} mi`,
		...input.eventTypes.map((eventType) => getEventTypeLabel(eventType)),
		...input.tags.map((tag) => formatTagLabel(tag)),
	]

	return parts.join(' · ').slice(0, 80)
}

export async function getSearchAlertsForUser(userId: string): Promise<SearchAlertRecord[]> {
	return db
		.select()
		.from(schema.searchAlert)
		.where(eq(schema.searchAlert.userId, userId))
		.orderBy(desc(schema.searchAlert.isActive), desc(schema.searchAlert.updatedAt))
}

export async function getNotificationPreferenceForUser(
	userId: string
): Promise<NotificationPreferenceSettings> {
	const rows = await db
		.select()
		.from(schema.notificationPreference)
		.where(eq(schema.notificationPreference.userId, userId))
		.limit(1)

	return resolveNotificationPreference(rows[0] ?? null)
}

export async function upsertNotificationPreferenceForUser(
	userId: string,
	settings: NotificationPreferenceSettings
) {
	const normalized: NotificationPreferenceSettings = {
		searchAlertsEnabled: settings.searchAlertsEnabled,
		searchAlertCadence: settings.searchAlertCadence,
	}

	const [preference] = await db
		.insert(schema.notificationPreference)
		.values({
			userId,
			searchAlertsEnabled: normalized.searchAlertsEnabled,
			searchAlertCadence: normalized.searchAlertCadence,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: schema.notificationPreference.userId,
			set: {
				searchAlertsEnabled: normalized.searchAlertsEnabled,
				searchAlertCadence: normalized.searchAlertCadence,
				updatedAt: new Date(),
			},
		})
		.returning()

	await db
		.update(schema.searchAlert)
		.set({ cadence: normalized.searchAlertCadence, updatedAt: new Date() })
		.where(eq(schema.searchAlert.userId, userId))

	return resolveNotificationPreference(preference)
}

export async function getRecentAlertNotificationsForUser(
	userId: string,
	limit = 6
): Promise<AlertNotificationRecord[]> {
	return db
		.select()
		.from(schema.notification)
		.where(
			and(
				eq(schema.notification.userId, userId),
				eq(schema.notification.type, 'saved_search_match')
			)
		)
		.orderBy(desc(schema.notification.createdAt))
		.limit(limit)
}

export async function findMatchingSearchAlertForUser(userId: string, input: SearchAlertInput) {
	const normalized = normalizeSearchAlertInput(input)
	const alerts = await getSearchAlertsForUser(userId)

	return (
		alerts.find((alert) => {
			const alertEventTypes = normalizeEventTypes(alert.eventTypes ?? [])
			const alertTags = normalizeTags(alert.tags ?? [])

			return (
				alert.locationLabel.trim().toLowerCase() === normalized.locationLabel.toLowerCase() &&
				alert.radiusMiles === normalized.radiusMiles &&
				arraysEqual(alertEventTypes, normalized.eventTypes) &&
				arraysEqual(alertTags, normalized.tags)
			)
		}) ?? null
	)
}

export async function saveSearchAlertForUser(userId: string, input: SearchAlertInput) {
	const normalized = normalizeSearchAlertInput(input)
	const [existing, preference] = await Promise.all([
		findMatchingSearchAlertForUser(userId, normalized),
		getNotificationPreferenceForUser(userId),
	])

	if (existing) {
		if (!existing.isActive || existing.cadence !== preference.searchAlertCadence) {
			const [reactivated] = await db
				.update(schema.searchAlert)
				.set({
					cadence: preference.searchAlertCadence,
					isActive: true,
					updatedAt: new Date(),
				})
				.where(and(eq(schema.searchAlert.userId, userId), eq(schema.searchAlert.id, existing.id)))
				.returning()

			return { alert: reactivated ?? existing, created: false }
		}

		return { alert: existing, created: false }
	}

	const [alert] = await db
		.insert(schema.searchAlert)
		.values({
			userId,
			label: buildSearchAlertLabel(normalized),
			locationLabel: normalized.locationLabel,
			latitude: toNullableNumericString(normalized.latitude),
			longitude: toNullableNumericString(normalized.longitude),
			radiusMiles: normalized.radiusMiles,
			eventTypes: normalized.eventTypes.length > 0 ? normalized.eventTypes : null,
			tags: normalized.tags.length > 0 ? normalized.tags : null,
			cadence: preference.searchAlertCadence,
		})
		.returning()

	return { alert, created: true }
}

export async function updateSearchAlertActiveState(
	userId: string,
	alertId: string,
	isActive: boolean
) {
	const [alert] = await db
		.update(schema.searchAlert)
		.set({ isActive, updatedAt: new Date() })
		.where(and(eq(schema.searchAlert.userId, userId), eq(schema.searchAlert.id, alertId)))
		.returning()

	return alert ?? null
}

export async function deleteSearchAlertForUser(userId: string, alertId: string) {
	const [alert] = await db
		.delete(schema.searchAlert)
		.where(and(eq(schema.searchAlert.userId, userId), eq(schema.searchAlert.id, alertId)))
		.returning()

	return alert ?? null
}

async function getDeliveredListingIdsByAlert(alertIds: string[]) {
	if (alertIds.length === 0) {
		return new Map<string, Set<string>>()
	}

	const rows = await db
		.select({
			searchAlertId: schema.searchAlertDelivery.searchAlertId,
			listingId: schema.searchAlertDelivery.listingId,
		})
		.from(schema.searchAlertDelivery)
		.where(inArray(schema.searchAlertDelivery.searchAlertId, alertIds))

	const deliveredByAlertId = new Map<string, Set<string>>()

	for (const row of rows) {
		const listingIds = deliveredByAlertId.get(row.searchAlertId) ?? new Set<string>()
		listingIds.add(row.listingId)
		deliveredByAlertId.set(row.searchAlertId, listingIds)
	}

	return deliveredByAlertId
}

function createDiscoveryFiltersFromAlert(alert: SearchAlertRecord) {
	return {
		place: alert.locationLabel,
		lat: alert.latitude?.toString() ?? null,
		lng: alert.longitude?.toString() ?? null,
		radius: String(alert.radiusMiles),
		type: (alert.eventTypes?.[0] ?? 'all') as DiscoveryEventType | 'all',
		tag: alert.tags?.[0] ?? null,
	}
}

export async function runSavedSearchAlertDelivery(
	now = new Date()
): Promise<SavedSearchAlertDeliverySummary> {
	const rows = await db
		.select({
			alert: schema.searchAlert,
			preference: schema.notificationPreference,
		})
		.from(schema.searchAlert)
		.leftJoin(
			schema.notificationPreference,
			eq(schema.searchAlert.userId, schema.notificationPreference.userId)
		)
		.where(eq(schema.searchAlert.isActive, true))
		.orderBy(desc(schema.searchAlert.updatedAt))

	const publishedListings = await getDeliverableDiscoveryListings(now)
	const deliveredByAlertId = await getDeliveredListingIdsByAlert(rows.map(({ alert }) => alert.id))

	const summary: SavedSearchAlertDeliverySummary = {
		activeAlerts: rows.length,
		checkedAlerts: 0,
		createdNotifications: 0,
		deliveredListings: 0,
		skippedAlerts: 0,
	}

	for (const { alert, preference } of rows) {
		const resolvedPreference = resolveNotificationPreference(preference)

		if (!resolvedPreference.searchAlertsEnabled) {
			summary.skippedAlerts += 1
			continue
		}

		if (!isSearchAlertDue(resolvedPreference.searchAlertCadence, alert.lastCheckedAt, now)) {
			summary.skippedAlerts += 1
			continue
		}

		summary.checkedAlerts += 1

		const latitude = toNullableNumber(alert.latitude)
		const longitude = toNullableNumber(alert.longitude)

		if (latitude === null || longitude === null) {
			await db
				.update(schema.searchAlert)
				.set({ lastCheckedAt: now, updatedAt: now })
				.where(eq(schema.searchAlert.id, alert.id))
			continue
		}

		const results = buildDiscoveryResults(
			createDiscoveryFiltersFromAlert(alert),
			publishedListings,
			now,
			{
				label: alert.locationLabel,
				latitude,
				longitude,
				zoom: 11.8,
				description: 'Saved search delivery run.',
			}
		)

		const deliveredListingIds = deliveredByAlertId.get(alert.id) ?? new Set<string>()
		const freshMatches = results.listings.filter((listing) => !deliveredListingIds.has(listing.id))

		if (freshMatches.length === 0) {
			await db
				.update(schema.searchAlert)
				.set({ lastCheckedAt: now, updatedAt: now })
				.where(eq(schema.searchAlert.id, alert.id))
			continue
		}

		const [notification] = await db
			.insert(schema.notification)
			.values({
				userId: alert.userId,
				type: 'saved_search_match',
				title: buildSavedSearchNotificationTitle(alert.locationLabel, freshMatches.length),
				body: buildSavedSearchNotificationBody(
					freshMatches.map((listing) => listing.title).slice(0, 3)
				),
				data: {
					searchAlertId: alert.id,
					listingIds: freshMatches.map((listing) => listing.id),
					listingSlugs: freshMatches.map((listing) => listing.slug),
					locationLabel: alert.locationLabel,
					radiusMiles: alert.radiusMiles,
				},
			})
			.returning()

		await db.insert(schema.searchAlertDelivery).values(
			freshMatches.map((listing) => ({
				searchAlertId: alert.id,
				userId: alert.userId,
				listingId: listing.id,
				notificationId: notification.id,
				status: 'delivered' as const,
			}))
		)

		await db
			.update(schema.searchAlert)
			.set({
				cadence: resolvedPreference.searchAlertCadence,
				lastCheckedAt: now,
				lastDeliveredAt: now,
				updatedAt: now,
			})
			.where(eq(schema.searchAlert.id, alert.id))

		summary.createdNotifications += 1
		summary.deliveredListings += freshMatches.length
	}

	return summary
}
