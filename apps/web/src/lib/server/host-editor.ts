import { db } from '$lib/server/db'
import { getHostBySlug, slugifyHostName } from '$lib/server/hosts'
import * as schema from '@hidden-gems/db/schema'
import { eq } from 'drizzle-orm'

export type HostEditorValues = {
	displayName: string
	slug: string
	bio: string
	locationLabel: string
}

export type HostEditorErrors = Partial<Record<keyof HostEditorValues | 'form', string>>

export function emptyHostValues(userName = ''): HostEditorValues {
	return {
		displayName: userName,
		slug: slugifyHostName(userName),
		bio: '',
		locationLabel: '',
	}
}

export function getHostValuesFromForm(formData: FormData): HostEditorValues {
	const displayName = String(formData.get('displayName') ?? '').trim()
	const submittedSlug = String(formData.get('slug') ?? '').trim()

	return {
		displayName,
		slug: slugifyHostName(submittedSlug || displayName),
		bio: String(formData.get('bio') ?? '').trim(),
		locationLabel: String(formData.get('locationLabel') ?? '').trim(),
	}
}

export async function validateHostValues(
	values: HostEditorValues,
	hostId?: string
): Promise<HostEditorErrors> {
	const errors: HostEditorErrors = {}

	if (values.displayName.length < 2) {
		errors.displayName = 'Choose a host name with at least 2 characters.'
	}

	if (!values.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
		errors.slug = 'Use lowercase letters, numbers, and dashes only.'
	}

	if (values.slug.length > 64) {
		errors.slug = 'Keep the slug under 64 characters.'
	}

	if (values.bio.length > 320) {
		errors.bio = 'Keep the bio under 320 characters.'
	}

	if (values.locationLabel.length > 120) {
		errors.locationLabel = 'Keep the location label under 120 characters.'
	}

	if (Object.keys(errors).length > 0) {
		return errors
	}

	const slugMatch = await getHostBySlug(values.slug)

	if (slugMatch && slugMatch.id !== hostId) {
		errors.slug = 'That profile link is already taken. Try a different variation.'
	}

	return errors
}

export async function createHostForUser(ownerUserId: string, values: HostEditorValues) {
	const [host] = await db
		.insert(schema.host)
		.values({
			ownerUserId,
			slug: values.slug,
			displayName: values.displayName,
			bio: values.bio || null,
			locationLabel: values.locationLabel || null,
		})
		.returning()

	return host
}

export async function updateHost(hostId: string, values: HostEditorValues) {
	const [host] = await db
		.update(schema.host)
		.set({
			slug: values.slug,
			displayName: values.displayName,
			bio: values.bio || null,
			locationLabel: values.locationLabel || null,
		})
		.where(eq(schema.host.id, hostId))
		.returning()

	return host
}
