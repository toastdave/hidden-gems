import { describe, expect, test } from 'bun:test'
import { buildDiscoveryResults, getSampleListings } from './discovery'

describe('buildDiscoveryResults', () => {
	test('uses a searched location override when provided', () => {
		const now = new Date('2026-04-01T12:00:00.000Z')
		const results = buildDiscoveryResults(
			{
				place: '78702',
				radius: '25',
				type: 'all',
			},
			getSampleListings(now),
			now,
			{
				label: '78702, Austin, Texas',
				latitude: 30.2653,
				longitude: -97.7182,
				zoom: 11.8,
				description: 'Showing results around your searched location.',
			}
		)

		expect(results.center.label).toBe('78702, Austin, Texas')
		expect(results.filters.near).toBeNull()
		expect(results.filters.place).toBe('78702')
		expect(results.filters.latitude).toBe('30.2653')
		expect(results.filters.longitude).toBe('-97.7182')
		expect(results.listings.length).toBeGreaterThan(0)
	})

	test('falls back to the selected preset center when no override exists', () => {
		const now = new Date('2026-04-01T12:00:00.000Z')
		const results = buildDiscoveryResults(
			{
				near: 'cedar-park',
				radius: '10',
			},
			getSampleListings(now),
			now
		)

		expect(results.center.key).toBe('cedar-park')
		expect(results.filters.near).toBe('cedar-park')
		expect(results.filters.place).toBe('')
		expect(results.filters.latitude).toBe('')
		expect(results.filters.longitude).toBe('')
	})

	test('filters listings to today when a today window is selected', () => {
		const now = new Date('2026-04-03T12:00:00.000Z')
		const results = buildDiscoveryResults(
			{
				date: 'today',
				radius: '50',
			},
			getSampleListings(now),
			now
		)

		expect(results.filters.date).toBe('today')
		expect(results.listings.map((listing) => listing.slug)).toEqual(['round-rock-night-market'])
	})

	test('preserves optional cover image metadata through results building', () => {
		const now = new Date('2026-04-03T12:00:00.000Z')
		const [firstListing] = getSampleListings(now)
		const results = buildDiscoveryResults(
			{
				radius: '50',
			},
			[
				{
					...firstListing,
					coverImageUrl: 'https://example.com/cover.jpg',
					coverImageAlt: 'Front porch preview',
				},
			],
			now
		)

		expect(results.listings[0]?.coverImageUrl).toBe('https://example.com/cover.jpg')
		expect(results.listings[0]?.coverImageAlt).toBe('Front porch preview')
	})

	test('filters listings to this weekend when the weekend window is selected', () => {
		const now = new Date('2026-04-03T12:00:00.000Z')
		const results = buildDiscoveryResults(
			{
				date: 'this_weekend',
				radius: '50',
			},
			getSampleListings(now),
			now
		)

		expect(results.filters.date).toBe('this_weekend')
		expect(results.listings.length).toBeGreaterThan(1)
		expect(results.listings.some((listing) => listing.slug === 'round-rock-night-market')).toBe(
			true
		)
		expect(results.listings.some((listing) => listing.slug === 'cherrywood-porch-sale')).toBe(true)
	})
})
