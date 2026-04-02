import { describe, expect, test } from 'bun:test'
import { listing, notificationPreference, plan, searchAlert, searchAlertDelivery } from './index'

describe('database schema', () => {
	test('listing table exposes expected columns', () => {
		expect(listing.title.name).toBe('title')
		expect(listing.status.name).toBe('status')
	})

	test('plan feature flags are stored as json', () => {
		expect(plan.featureFlags.name).toBe('feature_flags')
	})

	test('search alert tables expose delivery and preference columns', () => {
		expect(searchAlert.cadence.name).toBe('cadence')
		expect(notificationPreference.searchAlertsEnabled.name).toBe('search_alerts_enabled')
		expect(searchAlertDelivery.searchAlertId.name).toBe('search_alert_id')
	})
})
