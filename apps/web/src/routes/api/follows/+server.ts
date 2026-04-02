import { addFollowHost, canFollowHost, removeFollowHost } from '$lib/server/engagement'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

async function getHostId(request: Request) {
	const payload = await request.json().catch(() => null)
	const hostId = payload?.hostId

	return typeof hostId === 'string' ? hostId : null
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ ok: false, message: 'Sign in to follow hosts.' }, { status: 401 })
	}

	const hostId = await getHostId(request)

	if (!hostId) {
		return json({ ok: false, message: 'Choose a host to follow.' }, { status: 400 })
	}

	if (!(await canFollowHost(hostId))) {
		return json({ ok: false, message: 'Host not found.' }, { status: 404 })
	}

	await addFollowHost(locals.user.id, hostId)

	return json({ ok: true, isFollowing: true })
}

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ ok: false, message: 'Sign in to manage followed hosts.' }, { status: 401 })
	}

	const hostId = await getHostId(request)

	if (!hostId) {
		return json({ ok: false, message: 'Choose a host to update.' }, { status: 400 })
	}

	await removeFollowHost(locals.user.id, hostId)

	return json({ ok: true, isFollowing: false })
}
