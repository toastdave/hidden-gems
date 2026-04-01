const FALLBACK_APP_URL = 'http://localhost:1101'

export function buildAbsoluteUrl(baseUrl: string | undefined, path: string) {
	try {
		return new URL(path, baseUrl?.trim() || FALLBACK_APP_URL).toString()
	} catch {
		return new URL(path, FALLBACK_APP_URL).toString()
	}
}

export function resolveMetaImageUrl(baseUrl: string | undefined, imageUrl?: string | null) {
	if (!imageUrl?.trim()) {
		return null
	}

	try {
		return new URL(imageUrl, baseUrl?.trim() || FALLBACK_APP_URL).toString()
	} catch {
		return null
	}
}
