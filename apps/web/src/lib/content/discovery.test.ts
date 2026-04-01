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

	test('filters listings to tomorrow and exposes contextual date counts', () => {
		const now = new Date('2026-04-03T12:00:00.000Z')
		const results = buildDiscoveryResults(
			{
				date: 'tomorrow',
				radius: '50',
			},
			getSampleListings(now),
			now
		)

		expect(results.filters.date).toBe('tomorrow')
		expect(results.listings.length).toBe(6)
		expect(results.dateOptions.find((option) => option.value === 'tomorrow')?.count).toBe(6)
		expect(results.dateOptions.find((option) => option.value === 'next_7_days')?.count).toBe(9)
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

	test('filters listings to the next seven days when selected', () => {
		const now = new Date('2026-04-03T12:00:00.000Z')
		const results = buildDiscoveryResults(
			{
				date: 'next_7_days',
				radius: '50',
			},
			getSampleListings(now),
			now
		)

		expect(results.filters.date).toBe('next_7_days')
		expect(results.listings).toHaveLength(9)
	})

	test('supports sharable tag filters and exposes matching tag options', () => {
		const now = new Date('2026-04-03T12:00:00.000Z')
		const results = buildDiscoveryResults(
			{
				radius: '50',
				tag: 'records',
			},
			getSampleListings(now),
			now
		)

		expect(results.filters.tag).toBe('records')
		expect(results.listings.every((listing) => listing.tags.includes('records'))).toBe(true)
		expect(results.tagOptions[0]).toEqual({
			value: 'records',
			label: 'Records',
			count: 3,
		})
	})
})
