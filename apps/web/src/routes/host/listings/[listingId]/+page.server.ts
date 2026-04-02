import { getHostForUser } from '$lib/server/hosts'
import {
	getListingValuesFromForm,
	prepareListingSubmission,
	saveListing,
} from '$lib/server/listing-editor'
import {
	addListingMedia,
	deleteListingRecord,
	deleteMediaRecord,
	duplicateListingRecord,
	getListingForHost,
	getListingMedia,
	getListingTags,
	listingToValues,
	reorderListingMedia,
	setCoverMedia,
	updateListingStatus,
} from '$lib/server/listings'
import { deleteListingMediaObject, uploadListingMedia } from '$lib/server/storage'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
	}

	const host = await getHostForUser(locals.user.id)

	if (!host) {
		throw redirect(303, '/host/onboarding')
	}

	const listing = await getListingForHost(host.id, params.listingId)

	if (!listing) {
		throw redirect(303, '/host')
	}

	const [tags, media] = await Promise.all([getListingTags(listing.id), getListingMedia(listing.id)])

	return {
		host,
		listing,
		media,
		defaults: listingToValues(listing, tags),
		duplicated: url.searchParams.get('duplicated') === '1',
		statusUpdated: url.searchParams.get('status'),
		saved: url.searchParams.get('saved') === '1',
		mediaUpdated: url.searchParams.get('media') === '1',
	}
}

export const actions: Actions = {
	uploadMedia: async ({ locals, params, request, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		const formData = await request.formData()
		const file = formData.get('media')
		const altText = String(formData.get('altText') ?? '').trim()

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { mediaError: 'Choose an image to upload first.' })
		}

		if (!file.type.startsWith('image/')) {
			return fail(400, { mediaError: 'Only image uploads are supported right now.' })
		}

		if (file.size > 8 * 1024 * 1024) {
			return fail(400, { mediaError: 'Keep uploads under 8 MB for now.' })
		}

		try {
			const mediaId = crypto.randomUUID()
			const uploaded = await uploadListingMedia({ listingId: listing.id, mediaId, file })
			await addListingMedia({
				id: mediaId,
				listingId: listing.id,
				objectKey: uploaded.objectKey,
				url: uploaded.url,
				altText: altText || listing.title,
			})
		} catch (error) {
			console.error('Failed to upload listing media', error)
			return fail(500, {
				mediaError: 'We could not upload that image right now. Please try again.',
			})
		}

		throw redirect(303, `/host/listings/${listing.id}?media=1`)
	},
	setCover: async ({ locals, params, request, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		const mediaId = String((await request.formData()).get('mediaId') ?? '')

		if (!mediaId) {
			return fail(400, { mediaError: 'Pick an image to make it the cover.' })
		}

		await setCoverMedia(listing.id, mediaId)
		throw redirect(303, `/host/listings/${listing.id}?media=1`)
	},
	reorderMedia: async ({ locals, params, request, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		const formData = await request.formData()
		const mediaId = String(formData.get('mediaId') ?? '')
		const direction = formData.get('direction') === 'forward' ? 'forward' : 'backward'

		if (!mediaId) {
			return fail(400, { mediaError: 'Pick an image to move first.' })
		}

		await reorderListingMedia(listing.id, mediaId, direction)
		throw redirect(303, `/host/listings/${listing.id}?media=1`)
	},
	deleteMedia: async ({ locals, params, request, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		const mediaId = String((await request.formData()).get('mediaId') ?? '')

		if (!mediaId) {
			return fail(400, { mediaError: 'Pick an image to remove.' })
		}

		const media = await deleteMediaRecord(mediaId)

		if (media) {
			await deleteListingMediaObject(media.objectKey)
		}

		throw redirect(303, `/host/listings/${listing.id}?media=1`)
	},
	duplicate: async ({ locals, params, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		const tags = await getListingTags(listing.id)
		const duplicatedListing = await duplicateListingRecord({ hostId: host.id, listing, tags })

		throw redirect(303, `/host/listings/${duplicatedListing.id}?duplicated=1`)
	},
	moveToDraft: async ({ locals, params, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		await updateListingStatus(listing.id, 'draft')
		throw redirect(303, `/host/listings/${listing.id}?status=draft`)
	},
	archive: async ({ locals, params, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		await updateListingStatus(listing.id, 'archived')
		throw redirect(303, `/host/listings/${listing.id}?status=archived`)
	},
	cancel: async ({ locals, params, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		await updateListingStatus(listing.id, 'cancelled')
		throw redirect(303, `/host/listings/${listing.id}?status=cancelled`)
	},
	deleteListing: async ({ locals, params, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		const deleted = await deleteListingRecord(listing.id)

		await Promise.all(
			deleted.media.map((media) => deleteListingMediaObject(media.objectKey).catch(() => undefined))
		)

		throw redirect(303, '/host?deleted=1')
	},
	default: async ({ locals, params, request, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const listing = await getListingForHost(host.id, params.listingId)

		if (!listing) {
			throw redirect(303, '/host')
		}

		const submittedValues = getListingValuesFromForm(await request.formData())
		const { errors, values } = await prepareListingSubmission(submittedValues, listing.id)

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values })
		}

		try {
			await saveListing({
				hostId: host.id,
				listingId: listing.id,
				values,
				existingPublishedAt: listing.publishedAt,
			})
			throw redirect(303, `/host/listings/${listing.id}?saved=1`)
		} catch (error) {
			if (error instanceof Response) {
				throw error
			}

			console.error('Failed to update listing', error)
			return fail(500, {
				errors: {
					form: 'We could not save this listing right now. Please try again.',
				},
				values,
			})
		}
	},
}
