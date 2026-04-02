import {
	addFavoriteListing,
	canFavoriteListing,
	removeFavoriteListing,
} from '$lib/server/engagement'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

async function getListingId(request: Request) {
	const payload = await request.json().catch(() => null)
	const listingId = payload?.listingId

	return typeof listingId === 'string' ? listingId : null
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ ok: false, message: 'Sign in to save listings.' }, { status: 401 })
	}

	const listingId = await getListingId(request)

	if (!listingId) {
		return json({ ok: false, message: 'Choose a listing to save.' }, { status: 400 })
	}

	if (!(await canFavoriteListing(listingId))) {
		return json({ ok: false, message: 'Listing not found.' }, { status: 404 })
	}

	await addFavoriteListing(locals.user.id, listingId)

	return json({ ok: true, isFavorite: true })
}

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ ok: false, message: 'Sign in to manage saved listings.' }, { status: 401 })
	}

	const listingId = await getListingId(request)

	if (!listingId) {
		return json({ ok: false, message: 'Choose a listing to update.' }, { status: 400 })
	}

	await removeFavoriteListing(locals.user.id, listingId)

	return json({ ok: true, isFavorite: false })
}
