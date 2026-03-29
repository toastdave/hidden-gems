import { getHostForUser } from '$lib/server/hosts'
import {
	getListingValuesFromForm,
	saveListing,
	validateListingValues,
} from '$lib/server/listing-editor'
import { getListingForHost, getListingTags, listingToValues } from '$lib/server/listings'
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

	const tags = await getListingTags(listing.id)

	return {
		host,
		listing,
		defaults: listingToValues(listing, tags),
		saved: url.searchParams.get('saved') === '1',
	}
}

export const actions: Actions = {
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

		const values = getListingValuesFromForm(await request.formData())
		const errors = await validateListingValues(values, listing.id)

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
