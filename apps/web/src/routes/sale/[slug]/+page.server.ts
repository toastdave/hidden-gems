import {
	getListingBySlug,
	getPublicListingMedia,
	getPublicListingTags,
	getRelatedPublishedListings,
} from '$lib/server/listings'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const record = await getListingBySlug(params.slug)

	if (!record) {
		throw error(404, 'Listing not found')
	}

	const [tags, media] = await Promise.all([
		getPublicListingTags(record.listing.id),
		getPublicListingMedia(record.listing.id),
	])
	const relatedListings = await getRelatedPublishedListings(
		record.listing.id,
		record.listing.city,
		record.host.id
	)

	return {
		host: record.host,
		listing: record.listing,
		media,
		tags,
		relatedListings,
	}
}
