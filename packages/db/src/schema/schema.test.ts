import { describe, expect, test } from 'bun:test'
import { listing, plan } from './index'

describe('database schema', () => {
	test('listing table exposes expected columns', () => {
		expect(listing.title.name).toBe('title')
		expect(listing.status.name).toBe('status')
	})

	test('plan feature flags are stored as json', () => {
		expect(plan.featureFlags.name).toBe('feature_flags')
	})
})
