import { getDiscoveryResults } from '$lib/content/discovery'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ url }) =>
	getDiscoveryResults({
		near: url.searchParams.get('near'),
		q: url.searchParams.get('q'),
		type: url.searchParams.get('type'),
		radius: url.searchParams.get('radius'),
	})
