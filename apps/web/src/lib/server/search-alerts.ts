import {
	type DiscoveryEventType,
	eventTypeOptions,
	formatTagLabel,
	getEventTypeLabel,
	radiusOptions,
} from '$lib/content/discovery'
import { db } from '$lib/server/db'
import * as schema from '@hidden-gems/db/schema'
import { and, desc, eq } from 'drizzle-orm'

export type SearchAlertRecord = typeof schema.searchAlert.$inferSelect

export type SearchAlertInput = {
	locationLabel: string
	latitude: number | null
	longitude: number | null
	radiusMiles: number
	eventTypes: DiscoveryEventType[]
	tags: string[]
}

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
	const existing = await findMatchingSearchAlertForUser(userId, normalized)

	if (existing) {
		if (!existing.isActive) {
			const [reactivated] = await db
				.update(schema.searchAlert)
				.set({ isActive: true, updatedAt: new Date() })
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
