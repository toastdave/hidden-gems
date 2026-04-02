import {
	isValidNotificationCadence,
	upsertNotificationPreferenceForUser,
} from '$lib/server/search-alerts'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ ok: false, message: 'Sign in to manage alert preferences.' }, { status: 401 })
	}

	const payload = (await request.json().catch(() => null)) as {
		searchAlertsEnabled?: unknown
		searchAlertCadence?: unknown
	} | null

	if (typeof payload?.searchAlertsEnabled !== 'boolean') {
		return json(
			{ ok: false, message: 'Choose whether alert delivery is enabled.' },
			{ status: 400 }
		)
	}

	if (
		typeof payload.searchAlertCadence !== 'string' ||
		!isValidNotificationCadence(payload.searchAlertCadence)
	) {
		return json({ ok: false, message: 'Pick a supported delivery cadence.' }, { status: 400 })
	}

	const preference = await upsertNotificationPreferenceForUser(locals.user.id, {
		searchAlertsEnabled: payload.searchAlertsEnabled,
		searchAlertCadence: payload.searchAlertCadence,
	})

	return json({ ok: true, preference })
}
