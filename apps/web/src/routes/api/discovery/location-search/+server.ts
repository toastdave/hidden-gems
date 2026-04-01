import { getLocationSuggestions } from '$lib/server/geocoding'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

function getCoordinate(value: string | null, bounds: { min: number; max: number }) {
	if (!value?.trim()) {
		return null
	}

	const parsed = Number(value)

	if (!Number.isFinite(parsed) || parsed < bounds.min || parsed > bounds.max) {
		return null
	}

	return parsed
}

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q')?.trim() ?? ''

	if (query.length < 2) {
		return json({ suggestions: [] })
	}

	const latitude = getCoordinate(url.searchParams.get('lat'), { min: -90, max: 90 })
	const longitude = getCoordinate(url.searchParams.get('lng'), { min: -180, max: 180 })
	const proximity = latitude !== null && longitude !== null ? { latitude, longitude } : undefined

	const suggestions = await getLocationSuggestions(query, {
		countryCode: 'US',
		proximity,
	})

	return json({ suggestions })
}
