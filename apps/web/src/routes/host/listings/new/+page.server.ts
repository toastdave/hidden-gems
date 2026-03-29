import { getHostForUser } from '$lib/server/hosts'
import {
	getListingValuesFromForm,
	saveListing,
	validateListingValues,
} from '$lib/server/listing-editor'
import { defaultListingValues } from '$lib/server/listings'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

function nextMorningInputValue() {
	const date = new Date()
	date.setDate(date.getDate() + 1)
	date.setHours(9, 0, 0, 0)
	const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
	return offsetDate.toISOString().slice(0, 16)
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/auth/sign-in?redirectTo=/host/listings/new')
	}

	const host = await getHostForUser(locals.user.id)

	if (!host) {
		throw redirect(303, '/host/onboarding')
	}

	return {
		host,
		defaults: {
			...defaultListingValues(),
			startAt: nextMorningInputValue(),
			city: host.locationLabel?.includes('Austin') ? 'Austin' : '',
			region: 'TX',
		},
	}
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, '/auth/sign-in?redirectTo=/host/listings/new')
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const values = getListingValuesFromForm(await request.formData())
		const errors = await validateListingValues(values)

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values })
		}

		try {
			const listing = await saveListing({ hostId: host.id, values })
			throw redirect(303, `/host/listings/${listing.id}`)
		} catch (error) {
			if (error instanceof Response) {
				throw error
			}

			console.error('Failed to create listing', error)

			return fail(500, {
				errors: {
					form: 'We could not save this listing right now. Please try again.',
				},
				values,
			})
		}
	},
}
