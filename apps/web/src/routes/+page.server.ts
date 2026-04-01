import { getHomepageDiscoveryResults } from '$lib/server/discovery'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => ({
	...(await getHomepageDiscoveryResults({
		near: url.searchParams.get('near'),
		place: url.searchParams.get('place'),
		lat: url.searchParams.get('lat'),
		lng: url.searchParams.get('lng'),
		date: url.searchParams.get('date'),
		q: url.searchParams.get('q'),
		tag: url.searchParams.get('tag'),
		type: url.searchParams.get('type'),
		radius: url.searchParams.get('radius'),
	})),
	canonicalPath: `${url.pathname}${url.search}`,
})
