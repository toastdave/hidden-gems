import { getHostValuesFromForm, updateHost, validateHostValues } from '$lib/server/host-editor'
import { getHostForUser } from '$lib/server/hosts'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || !locals.session) {
		throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
	}

	const host = await getHostForUser(locals.user.id)

	if (!host) {
		throw redirect(303, '/host/onboarding')
	}

	return {
		host,
		defaults: {
			displayName: host.displayName,
			slug: host.slug,
			bio: host.bio ?? '',
			locationLabel: host.locationLabel ?? '',
		},
		saved: url.searchParams.get('saved') === '1',
	}
}

export const actions: Actions = {
	default: async ({ locals, request, url }) => {
		if (!locals.user || !locals.session) {
			throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname)}`)
		}

		const host = await getHostForUser(locals.user.id)

		if (!host) {
			throw redirect(303, '/host/onboarding')
		}

		const values = getHostValuesFromForm(await request.formData())
		const errors = await validateHostValues(values, host.id)

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values })
		}

		try {
			await updateHost(host.id, values)
		} catch (error) {
			console.error('Failed to update host', error)

			return fail(500, {
				errors: {
					form: 'We could not save your host profile right now. Please try again.',
				},
				values,
			})
		}

		throw redirect(303, '/host/profile?saved=1')
	},
}
