import { deleteSearchAlertForUser, updateSearchAlertActiveState } from '$lib/server/search-alerts'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ ok: false, message: 'Sign in to manage saved searches.' }, { status: 401 })
	}

	const payload = (await request.json().catch(() => null)) as { isActive?: unknown } | null

	if (typeof payload?.isActive !== 'boolean') {
		return json(
			{ ok: false, message: 'Choose whether this search should stay active.' },
			{ status: 400 }
		)
	}

	const alert = await updateSearchAlertActiveState(locals.user.id, params.alertId, payload.isActive)

	if (!alert) {
		return json({ ok: false, message: 'Saved search not found.' }, { status: 404 })
	}

	return json({ ok: true, isActive: alert.isActive })
}

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ ok: false, message: 'Sign in to manage saved searches.' }, { status: 401 })
	}

	const alert = await deleteSearchAlertForUser(locals.user.id, params.alertId)

	if (!alert) {
		return json({ ok: false, message: 'Saved search not found.' }, { status: 404 })
	}

	return json({ ok: true })
}
