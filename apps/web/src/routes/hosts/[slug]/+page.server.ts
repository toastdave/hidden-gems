import { getHostBySlug, getPublishedHostListings } from '$lib/server/hosts'
import { getListingTags } from '$lib/server/listings'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const host = await getHostBySlug(params.slug)

	if (!host) {
		throw error(404, 'Host not found')
	}

	const listings = await getPublishedHostListings(host.id)
	const listingTags = await Promise.all(
		listings.map(async (listing) => ({
			listingId: listing.id,
			tags: await getListingTags(listing.id),
		}))
	)

	return {
		host,
		listings,
		listingTags,
	}
}
