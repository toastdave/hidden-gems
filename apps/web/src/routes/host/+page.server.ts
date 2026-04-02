import { getHostForUser, getHostListings } from '$lib/server/hosts'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const statusFilters = ['all', 'published', 'draft', 'archived', 'cancelled'] as const

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/auth/sign-in?redirectTo=/host')
	}

	const host = await getHostForUser(locals.user.id)

	if (!host) {
		throw redirect(303, '/host/onboarding')
	}

	const listings = await getHostListings(host.id)
	const requestedStatus = url.searchParams.get('status') ?? 'all'
	const statusFilter = statusFilters.includes(requestedStatus as (typeof statusFilters)[number])
		? (requestedStatus as (typeof statusFilters)[number])
		: 'all'
	const filteredListings =
		statusFilter === 'all'
			? listings
			: listings.filter((listing) => listing.status === statusFilter)

	return {
		host,
		listings: filteredListings,
		deleted: url.searchParams.get('deleted') === '1',
		selectedStatus: statusFilter,
		stats: {
			total: listings.length,
			published: listings.filter((listing) => listing.status === 'published').length,
			draft: listings.filter((listing) => listing.status === 'draft').length,
			archived: listings.filter((listing) => listing.status === 'archived').length,
			cancelled: listings.filter((listing) => listing.status === 'cancelled').length,
		},
		user: locals.user,
	}
}
