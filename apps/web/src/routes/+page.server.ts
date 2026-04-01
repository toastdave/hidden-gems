import { getHomepageDiscoveryResults } from '$lib/server/discovery'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) =>
	getHomepageDiscoveryResults({
		near: url.searchParams.get('near'),
		place: url.searchParams.get('place'),
		lat: url.searchParams.get('lat'),
		lng: url.searchParams.get('lng'),
		date: url.searchParams.get('date'),
		q: url.searchParams.get('q'),
		type: url.searchParams.get('type'),
		radius: url.searchParams.get('radius'),
	})
