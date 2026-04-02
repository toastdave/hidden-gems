import { getHomepageDiscoveryResults } from '$lib/server/discovery'
import { getFavoritedListingIds } from '$lib/server/engagement'
import { findMatchingSearchAlertForUser } from '$lib/server/search-alerts'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	const results = await getHomepageDiscoveryResults({
		near: url.searchParams.get('near'),
		place: url.searchParams.get('place'),
		lat: url.searchParams.get('lat'),
		lng: url.searchParams.get('lng'),
		date: url.searchParams.get('date'),
		q: url.searchParams.get('q'),
		tag: url.searchParams.get('tag'),
		type: url.searchParams.get('type'),
		radius: url.searchParams.get('radius'),
	})

	const [favoriteListingIds, matchingSearchAlert] = locals.user
		? await Promise.all([
				getFavoritedListingIds(
					locals.user.id,
					results.listings.map((listing) => listing.id)
				),
				findMatchingSearchAlertForUser(locals.user.id, {
					locationLabel: results.center.label,
					latitude: results.center.latitude,
					longitude: results.center.longitude,
					radiusMiles: results.filters.radiusMiles,
					eventTypes: results.filters.type !== 'all' ? [results.filters.type] : [],
					tags: results.filters.tag ? [results.filters.tag] : [],
				}),
			])
		: [[], null]

	return {
		...results,
		canonicalPath: `${url.pathname}${url.search}`,
		favoriteListingIds,
		hasSavedSearchAlert: Boolean(matchingSearchAlert?.isActive),
	}
}
