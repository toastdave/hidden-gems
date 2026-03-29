import { getHostForUser, getHostListings } from '$lib/server/hosts'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/auth/sign-in?redirectTo=/host')
	}

	const host = await getHostForUser(locals.user.id)

	if (!host) {
		throw redirect(303, '/host/onboarding')
	}

	const listings = await getHostListings(host.id)

	return {
		host,
		listings,
		stats: {
			total: listings.length,
			published: listings.filter((listing) => listing.status === 'published').length,
			draft: listings.filter((listing) => listing.status === 'draft').length,
		},
		user: locals.user,
	}
}
