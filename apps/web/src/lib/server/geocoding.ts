import { env } from '$env/dynamic/private'

const MAPTILER_GEOCODING_BASE_URL = 'https://api.maptiler.com/geocoding'

type MapTilerFeature = {
	center?: [number, number]
	geometry?: {
		coordinates?: [number, number]
	}
	place_name?: string
	text?: string
}

type MapTilerGeocodingResponse = {
	features?: MapTilerFeature[]
}

export type GeocodeSuccess = {
	ok: true
	result: {
		label: string
		latitude: number
		longitude: number
	}
}

export type GeocodeFailure = {
	ok: false
	reason: 'missing_query' | 'unavailable' | 'not_found' | 'error'
	message: string
}

export type GeocodeResult = GeocodeSuccess | GeocodeFailure

function getFeatureCoordinates(
	feature: MapTilerFeature
): { latitude: number; longitude: number } | null {
	const [longitude, latitude] = feature.center ?? feature.geometry?.coordinates ?? []

	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return null
	}

	return {
		latitude: Number(latitude),
		longitude: Number(longitude),
	}
}

function getFeatureLabel(feature: MapTilerFeature, fallback: string) {
	if (typeof feature.place_name === 'string' && feature.place_name.trim()) {
		return feature.place_name.trim()
	}

	if (typeof feature.text === 'string' && feature.text.trim()) {
		return feature.text.trim()
	}

	return fallback
}

export async function geocodeSearchQuery(
	query: string,
	options?: {
		autocomplete?: boolean
		countryCode?: string
		proximity?: { latitude: number; longitude: number }
	}
): Promise<GeocodeResult> {
	const normalizedQuery = query.trim()

	if (!normalizedQuery) {
		return {
			ok: false,
			reason: 'missing_query',
			message: 'Enter a city, ZIP code, or neighborhood first.',
		}
	}

	const apiKey = env.MAPTILER_API_KEY?.trim()

	if (!apiKey) {
		return {
			ok: false,
			reason: 'unavailable',
			message: 'Location lookup is not configured yet. Try one of the saved neighborhoods instead.',
		}
	}

	const url = new URL(`${MAPTILER_GEOCODING_BASE_URL}/${encodeURIComponent(normalizedQuery)}.json`)
	url.searchParams.set('key', apiKey)
	url.searchParams.set('limit', '1')
	url.searchParams.set('autocomplete', options?.autocomplete ? 'true' : 'false')
	url.searchParams.set('language', 'en')
	url.searchParams.set('worldview', 'us')

	if (options?.countryCode?.trim()) {
		url.searchParams.set('country', options.countryCode.trim().toLowerCase())
	}

	if (options?.proximity) {
		url.searchParams.set(
			'proximity',
			`${options.proximity.longitude},${options.proximity.latitude}`
		)
	}

	try {
		const response = await fetch(url, {
			headers: {
				accept: 'application/json',
			},
		})

		if (!response.ok) {
			return {
				ok: false,
				reason: response.status === 403 ? 'unavailable' : 'error',
				message:
					response.status === 403
						? 'Location lookup is not available right now. Try one of the saved neighborhoods instead.'
						: 'We could not look up that location right now. Please try again in a moment.',
			}
		}

		const payload = (await response.json()) as MapTilerGeocodingResponse
		const feature = payload.features?.[0]

		if (!feature) {
			return {
				ok: false,
				reason: 'not_found',
				message: 'We could not place that search. Try a city, ZIP code, or neighborhood name.',
			}
		}

		const coordinates = getFeatureCoordinates(feature)

		if (!coordinates) {
			return {
				ok: false,
				reason: 'error',
				message: 'That search returned an unexpected map result. Please try another place.',
			}
		}

		return {
			ok: true,
			result: {
				label: getFeatureLabel(feature, normalizedQuery),
				latitude: coordinates.latitude,
				longitude: coordinates.longitude,
			},
		}
	} catch (error) {
		console.error('MapTiler geocoding failed', error)

		return {
			ok: false,
			reason: 'error',
			message: 'We could not look up that location right now. Please try again in a moment.',
		}
	}
}

export async function geocodeListingAddress(address: {
	addressLine1: string
	addressLine2?: string
	city: string
	region: string
	postalCode?: string
	countryCode?: string
}) {
	const query = [
		address.addressLine1,
		address.addressLine2,
		address.city,
		address.region,
		address.postalCode,
		address.countryCode || 'US',
	]
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(', ')

	return geocodeSearchQuery(query, {
		autocomplete: false,
		countryCode: address.countryCode || 'US',
	})
}
