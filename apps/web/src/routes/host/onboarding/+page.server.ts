import { db } from '$lib/server/db'
import { getHostBySlug, getHostForUser, slugifyHostName } from '$lib/server/hosts'
import * as schema from '@hidden-gems/db/schema'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

type OnboardingValues = {
	displayName: string
	slug: string
	bio: string
	locationLabel: string
}

function emptyValues(userName = ''): OnboardingValues {
	return {
		displayName: userName,
		slug: slugifyHostName(userName),
		bio: '',
		locationLabel: '',
	}
}

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
		defaults: emptyValues(locals.user.name),
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

		const formData = await request.formData()
		const displayName = String(formData.get('displayName') ?? '').trim()
		const submittedSlug = String(formData.get('slug') ?? '').trim()
		const bio = String(formData.get('bio') ?? '').trim()
		const locationLabel = String(formData.get('locationLabel') ?? '').trim()
		const slug = slugifyHostName(submittedSlug || displayName)

		const values = {
			displayName,
			slug,
			bio,
			locationLabel,
		}

		const errors: Partial<Record<keyof OnboardingValues | 'form', string>> = {}

		if (displayName.length < 2) {
			errors.displayName = 'Choose a host name with at least 2 characters.'
		}

		if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
			errors.slug = 'Use lowercase letters, numbers, and dashes only.'
		}

		if (slug.length > 64) {
			errors.slug = 'Keep the slug under 64 characters.'
		}

		if (bio.length > 320) {
			errors.bio = 'Keep the bio under 320 characters.'
		}

		if (locationLabel.length > 120) {
			errors.locationLabel = 'Keep the location label under 120 characters.'
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, values })
		}

		const slugMatch = await getHostBySlug(slug)

		if (slugMatch) {
			return fail(400, {
				errors: {
					slug: 'That profile link is already taken. Try a different variation.',
				},
				values,
			})
		}

		try {
			await db.insert(schema.host).values({
				ownerUserId: locals.user.id,
				slug,
				displayName,
				bio: bio || null,
				locationLabel: locationLabel || null,
			})
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
