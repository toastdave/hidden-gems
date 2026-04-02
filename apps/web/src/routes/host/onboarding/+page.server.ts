import {
	createHostForUser,
	emptyHostValues,
	getHostValuesFromForm,
	validateHostValues,
} from '$lib/server/host-editor'
import { getHostForUser } from '$lib/server/hosts'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, '/auth/sign-in?redirectTo=/host/onboarding')
	}

	const existingHost = await getHostForUser(locals.user.id)

	if (existingHost) {
		throw redirect(303, '/host')
	}

	return {
		user: locals.user,
		defaults: emptyHostValues(locals.user.name),
	}
}

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, '/auth/sign-in?redirectTo=/host/onboarding')
		}

		if (await getHostForUser(locals.user.id)) {
			throw redirect(303, '/host')
		}

		const values = getHostValuesFromForm(await request.formData())
		const errors = await validateHostValues(values)

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values })
		}

		try {
			await createHostForUser(locals.user.id, values)
		} catch (error) {
			console.error('Failed to create host', error)

			return fail(500, {
				errors: {
					form: 'We could not save your host profile right now. Please try again.',
				},
				values,
			})
		}

		throw redirect(303, '/host')
	},
}
