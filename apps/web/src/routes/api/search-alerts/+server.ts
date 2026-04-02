import {
	isValidSearchAlertEventType,
	isValidSearchAlertRadius,
	saveSearchAlertForUser,
} from '$lib/server/search-alerts'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

type SearchAlertPayload = {
	eventType?: unknown
	latitude?: unknown
	locationLabel?: unknown
	longitude?: unknown
	radiusMiles?: unknown
	tag?: unknown
}

function toOptionalNumber(value: unknown) {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value
	}

	if (typeof value === 'string' && value.trim()) {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : null
	}

	return null
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ ok: false, message: 'Sign in to save searches.' }, { status: 401 })
	}

	const payload = (await request.json().catch(() => null)) as SearchAlertPayload | null
	const locationLabel =
		typeof payload?.locationLabel === 'string' ? payload.locationLabel.trim() : ''
	const radiusMiles = toOptionalNumber(payload?.radiusMiles)
	const latitude = toOptionalNumber(payload?.latitude)
	const longitude = toOptionalNumber(payload?.longitude)
	const eventType = typeof payload?.eventType === 'string' ? payload.eventType.trim() : ''
	const tag = typeof payload?.tag === 'string' ? payload.tag.trim() : ''

	if (!locationLabel) {
		return json(
			{ ok: false, message: 'Choose a location before saving this search.' },
			{ status: 400 }
		)
	}

	if (radiusMiles === null || !isValidSearchAlertRadius(radiusMiles)) {
		return json({ ok: false, message: 'Pick a supported search radius.' }, { status: 400 })
	}

	const result = await saveSearchAlertForUser(locals.user.id, {
		locationLabel,
		latitude,
		longitude,
		radiusMiles,
		eventTypes: isValidSearchAlertEventType(eventType) ? [eventType] : [],
		tags: tag ? [tag] : [],
	})

	return json({ ok: true, alertId: result.alert.id, created: result.created })
}
