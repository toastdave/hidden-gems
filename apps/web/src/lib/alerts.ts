export type NotificationCadence = 'instant' | 'daily'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export function isSearchAlertDue(
	cadence: NotificationCadence,
	lastCheckedAt?: string | Date | null,
	now = new Date()
) {
	if (cadence === 'instant') {
		return true
	}

	if (!lastCheckedAt) {
		return true
	}

	return now.getTime() - new Date(lastCheckedAt).getTime() >= DAY_IN_MS
}

export function buildSavedSearchNotificationTitle(locationLabel: string, matchCount: number) {
	return matchCount === 1
		? `New saved-search match near ${locationLabel}`
		: `${matchCount} new saved-search matches near ${locationLabel}`
}

export function buildSavedSearchNotificationBody(listingTitles: string[]) {
	if (listingTitles.length === 0) {
		return 'A saved search ran, but there were no new listings to highlight.'
	}

	if (listingTitles.length === 1) {
		return `${listingTitles[0]} is now worth checking.`
	}

	if (listingTitles.length === 2) {
		return `${listingTitles[0]} and ${listingTitles[1]} are now worth checking.`
	}

	return `${listingTitles[0]}, ${listingTitles[1]}, and ${listingTitles.length - 2} more listings are now worth checking.`
}
