import { describe, expect, test } from 'bun:test'
import {
	buildSavedSearchNotificationBody,
	buildSavedSearchNotificationTitle,
	isSearchAlertDue,
} from './alerts'

describe('search alert helpers', () => {
	test('daily cadence waits until a full day has passed', () => {
		const now = new Date('2026-04-03T12:00:00.000Z')

		expect(isSearchAlertDue('daily', '2026-04-02T11:00:00.000Z', now)).toBe(true)
		expect(isSearchAlertDue('daily', '2026-04-03T01:00:00.000Z', now)).toBe(false)
	})

	test('instant cadence is always due', () => {
		expect(isSearchAlertDue('instant', '2026-04-03T01:00:00.000Z')).toBe(true)
	})

	test('builds readable saved search notification copy', () => {
		expect(buildSavedSearchNotificationTitle('East Austin', 1)).toBe(
			'New saved-search match near East Austin'
		)
		expect(buildSavedSearchNotificationBody(['Cherrywood Porch Sale Crawl'])).toBe(
			'Cherrywood Porch Sale Crawl is now worth checking.'
		)
		expect(
			buildSavedSearchNotificationBody([
				'Cherrywood Porch Sale Crawl',
				'Tarrytown Estate Edit',
				'Mueller Morning Market',
			])
		).toBe(
			'Cherrywood Porch Sale Crawl, Tarrytown Estate Edit, and 1 more listings are now worth checking.'
		)
	})
})
