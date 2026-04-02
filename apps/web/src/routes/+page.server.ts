import { getHomepageDiscoveryResults } from '$lib/server/discovery'
import { getFavoritedListingIds } from '$lib/server/engagement'
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

	const favoriteListingIds = locals.user
		? await getFavoritedListingIds(
				locals.user.id,
				results.listings.map((listing) => listing.id)
			)
		: []

	return {
		...results,
		canonicalPath: `${url.pathname}${url.search}`,
		favoriteListingIds,
	}
}
