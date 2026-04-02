import { getFavoriteListingsForUser, getFollowedHostsForUser } from '$lib/server/engagement'
import { getHostForUser } from '$lib/server/hosts'
import { getSearchAlertsForUser } from '$lib/server/search-alerts'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/auth/sign-in?redirectTo=/account')
	}

	const [host, favoriteListings, followedHosts, searchAlerts] = await Promise.all([
		getHostForUser(locals.user.id),
		getFavoriteListingsForUser(locals.user.id),
		getFollowedHostsForUser(locals.user.id),
		getSearchAlertsForUser(locals.user.id),
	])

	return {
		favoriteListings,
		followedHosts,
		searchAlerts,
		host,
		session: locals.session,
		user: locals.user,
	}
}
