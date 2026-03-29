import { getHostForUser } from '$lib/server/hosts'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/auth/sign-in?redirectTo=/account')
	}

	const host = await getHostForUser(locals.user.id)

	return {
		host,
		session: locals.session,
		user: locals.user,
	}
}
