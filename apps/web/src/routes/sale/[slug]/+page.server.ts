import { getFavoritedListingIds, getFollowedHostIds } from '$lib/server/engagement'
import {
	getListingBySlug,
	getPublicListingMedia,
	getPublicListingTags,
	getRelatedPublishedListings,
} from '$lib/server/listings'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
	const record = await getListingBySlug(params.slug)

	if (!record) {
		throw error(404, 'Listing not found')
	}

	const [tags, media, favoriteListingIds, followedHostIds] = await Promise.all([
		getPublicListingTags(record.listing.id),
		getPublicListingMedia(record.listing.id),
		locals.user
			? getFavoritedListingIds(locals.user.id, [record.listing.id])
			: Promise.resolve<string[]>([]),
		locals.user
			? getFollowedHostIds(locals.user.id, [record.host.id])
			: Promise.resolve<string[]>([]),
	])
	const relatedListings = await getRelatedPublishedListings(
		record.listing.id,
		record.listing.city,
		record.host.id
	)

	return {
		canonicalPath: `/sale/${record.listing.slug}`,
		host: record.host,
		listing: record.listing,
		media,
		tags,
		relatedListings,
		isFavorited: favoriteListingIds.includes(record.listing.id),
		isFollowingHost: followedHostIds.includes(record.host.id),
	}
}
