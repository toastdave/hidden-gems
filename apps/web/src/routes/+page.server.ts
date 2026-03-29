import { getHomepageDiscoveryResults } from '$lib/server/discovery'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) =>
	getHomepageDiscoveryResults({
		near: url.searchParams.get('near'),
		q: url.searchParams.get('q'),
		type: url.searchParams.get('type'),
		radius: url.searchParams.get('radius'),
	})
