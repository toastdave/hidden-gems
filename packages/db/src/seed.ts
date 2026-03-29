import { drizzle } from 'drizzle-orm/postgres-js'
import { createDbClient } from './client'
import { host, listing, listingTag, plan, user } from './schema/index'

const client = createDbClient()
const db = drizzle(client)

const DAY = 24 * 60 * 60 * 1000

function nextOccurrence(baseDate: Date, dayOfWeek: number, hour: number, minute = 0) {
	const date = new Date(baseDate)
	date.setHours(hour, minute, 0, 0)

	const delta = (dayOfWeek - date.getDay() + 7) % 7
	date.setDate(date.getDate() + delta)

	if (date.getTime() <= baseDate.getTime()) {
		date.setDate(date.getDate() + 7)
	}

	return date
}

function addHours(date: Date, hours: number) {
	return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

const now = new Date()
const saturdayMorning = nextOccurrence(now, 6, 8)
const saturdayNoon = nextOccurrence(now, 6, 12)
const saturdayAfternoon = nextOccurrence(now, 6, 15)
const sundayMorning = nextOccurrence(now, 0, 9)
const sundayAfternoon = nextOccurrence(now, 0, 13)
const fridayEvening = nextOccurrence(now, 5, 16)

const users = [
	{
		id: 'seed-host-cherrywood',
		name: 'Cherrywood Neighbors',
		email: 'cherrywood@example.com',
		emailVerified: true,
	},
	{
		id: 'seed-host-estate',
		name: 'Hill Country Estate Co.',
		email: 'estate@example.com',
		emailVerified: true,
	},
	{
		id: 'seed-host-mercado',
		name: 'Mercado Club',
		email: 'mercado@example.com',
		emailVerified: true,
	},
	{
		id: 'seed-host-round-rock',
		name: 'Downtown Round Rock Alliance',
		email: 'roundrock@example.com',
		emailVerified: true,
	},
]

const hosts = [
	{
		id: '11111111-1111-4111-8111-111111111111',
		ownerUserId: 'seed-host-cherrywood',
		slug: 'cherrywood-neighbors',
		displayName: 'Cherrywood Neighbors',
		bio: 'Weekend neighborhood hosts sharing multi-home porch sales, books, records, and furniture finds.',
		locationLabel: 'East Austin',
		isVerified: true,
	},
	{
		id: '22222222-2222-4222-8222-222222222222',
		ownerUserId: 'seed-host-estate',
		slug: 'hill-country-estate-co',
		displayName: 'Hill Country Estate Co.',
		bio: 'Curated estate sales with antiques, art, furniture, and collector-friendly household edits.',
		locationLabel: 'Central Austin',
		isVerified: true,
	},
	{
		id: '33333333-3333-4333-8333-333333333333',
		ownerUserId: 'seed-host-mercado',
		slug: 'mercado-club',
		displayName: 'Mercado Club',
		bio: 'Pop-up market hosts focused on vintage clothing, local makers, food, and neighborhood energy.',
		locationLabel: 'East Austin',
		isVerified: false,
	},
	{
		id: '44444444-4444-4444-8444-444444444444',
		ownerUserId: 'seed-host-round-rock',
		slug: 'downtown-round-rock-alliance',
		displayName: 'Downtown Round Rock Alliance',
		bio: 'Community organizer for walkable vendor nights, food trucks, and curated local seller events.',
		locationLabel: 'Round Rock',
		isVerified: false,
	},
]

const listings = [
	{
		id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
		hostId: '11111111-1111-4111-8111-111111111111',
		slug: 'cherrywood-porch-sale',
		title: 'Cherrywood Porch Sale Crawl',
		description:
			'Multi-home porch sale with records, art books, small furniture, and kitchen finds.',
		eventType: 'yard_sale' as const,
		status: 'published' as const,
		startAt: saturdayMorning,
		endAt: addHours(saturdayMorning, 6),
		timezone: 'America/Chicago',
		locationLabel: 'Maplewood Ave & E 38 1/2 St',
		city: 'Austin',
		region: 'TX',
		postalCode: '78722',
		countryCode: 'US',
		latitude: '30.288200',
		longitude: '-97.718400',
		priceSummary: 'Most items $2-$40',
		isFeatured: true,
		publishedAt: new Date(saturdayMorning.getTime() - DAY),
	},
	{
		id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
		hostId: '22222222-2222-4222-8222-222222222222',
		slug: 'tarrytown-estate-edit',
		title: 'Tarrytown Estate Edit',
		description:
			'Curated estate sale with teak furniture, glassware, framed art, and garage tools.',
		eventType: 'estate_sale' as const,
		status: 'published' as const,
		startAt: saturdayMorning,
		endAt: addHours(saturdayMorning, 7),
		timezone: 'America/Chicago',
		locationLabel: 'Scenic Dr near Enfield Rd',
		city: 'Austin',
		region: 'TX',
		postalCode: '78703',
		countryCode: 'US',
		latitude: '30.298700',
		longitude: '-97.782700',
		priceSummary: 'Collector pieces and household lots',
		isFeatured: true,
		publishedAt: new Date(saturdayMorning.getTime() - DAY),
	},
	{
		id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
		hostId: '33333333-3333-4333-8333-333333333333',
		slug: 'eastside-vintage-pop-up',
		title: 'Eastside Vintage Pop-Up',
		description: 'Rotating racks of vintage denim, handmade jewelry, ceramics, and fresh pastries.',
		eventType: 'pop_up_market' as const,
		status: 'published' as const,
		startAt: saturdayNoon,
		endAt: addHours(saturdayNoon, 5),
		timezone: 'America/Chicago',
		locationLabel: 'Springdale Station',
		city: 'Austin',
		region: 'TX',
		postalCode: '78721',
		countryCode: 'US',
		latitude: '30.281600',
		longitude: '-97.683500',
		priceSummary: 'Vintage and maker goods',
		isFeatured: false,
		publishedAt: new Date(saturdayNoon.getTime() - DAY),
	},
	{
		id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
		hostId: '33333333-3333-4333-8333-333333333333',
		slug: 'mueller-morning-market',
		title: 'Mueller Morning Market',
		description:
			'Open-air flea blend with plants, vintage lamps, records, and neighborhood bakers.',
		eventType: 'flea_market' as const,
		status: 'published' as const,
		startAt: sundayMorning,
		endAt: addHours(sundayMorning, 4),
		timezone: 'America/Chicago',
		locationLabel: 'Aldrich St Plaza',
		city: 'Austin',
		region: 'TX',
		postalCode: '78723',
		countryCode: 'US',
		latitude: '30.300900',
		longitude: '-97.705200',
		priceSummary: 'Browse all morning',
		isFeatured: false,
		publishedAt: new Date(sundayMorning.getTime() - DAY),
	},
	{
		id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
		hostId: '11111111-1111-4111-8111-111111111111',
		slug: 'south-congress-garage-sale',
		title: 'South Congress Garage Sale Block',
		description:
			'Family garage sale block with bikes, games, patio gear, and back-to-school finds.',
		eventType: 'garage_sale' as const,
		status: 'published' as const,
		startAt: saturdayMorning,
		endAt: addHours(saturdayMorning, 5),
		timezone: 'America/Chicago',
		locationLabel: 'Fairmount Ave',
		city: 'Austin',
		region: 'TX',
		postalCode: '78704',
		countryCode: 'US',
		latitude: '30.245100',
		longitude: '-97.743700',
		priceSummary: 'Bundle deals all day',
		isFeatured: false,
		publishedAt: new Date(saturdayMorning.getTime() - DAY),
	},
	{
		id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
		hostId: '44444444-4444-4444-8444-444444444444',
		slug: 'round-rock-night-market',
		title: 'Round Rock Night Market',
		description:
			'Food trucks, handmade candles, secondhand fashion, and a late-evening vintage row.',
		eventType: 'pop_up_market' as const,
		status: 'published' as const,
		startAt: fridayEvening,
		endAt: addHours(fridayEvening, 5),
		timezone: 'America/Chicago',
		locationLabel: 'Prete Main St Plaza',
		city: 'Round Rock',
		region: 'TX',
		postalCode: '78664',
		countryCode: 'US',
		latitude: '30.508800',
		longitude: '-97.678900',
		priceSummary: 'Late hours and easy parking',
		isFeatured: false,
		publishedAt: new Date(fridayEvening.getTime() - DAY),
	},
]

const listingTags = [
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', tag: 'records' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', tag: 'home decor' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', tag: 'books' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', tag: 'furniture' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', tag: 'art' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', tag: 'tools' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', tag: 'vintage' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', tag: 'jewelry' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', tag: 'food' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', tag: 'plants' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', tag: 'lamps' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', tag: 'records' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', tag: 'family' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', tag: 'outdoor' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', tag: 'kids' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', tag: 'food trucks' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', tag: 'fashion' },
	{ listingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', tag: 'candles' },
]

try {
	await db
		.insert(plan)
		.values([
			{
				id: 'free',
				slug: 'free',
				name: 'Free',
				monthlyPriceCents: 0,
				annualPriceCents: 0,
				featureFlags: {
					maxPhotos: 4,
					maxActiveListings: 1,
					maxAlerts: 3,
					featuredListings: false,
				},
			},
			{
				id: 'host-plus',
				slug: 'host-plus',
				name: 'Host Plus',
				monthlyPriceCents: 1200,
				annualPriceCents: 12000,
				featureFlags: {
					maxPhotos: 16,
					maxActiveListings: 10,
					maxAlerts: 15,
					featuredListings: true,
				},
			},
		])
		.onConflictDoNothing()

	await db.insert(user).values(users).onConflictDoNothing()
	await db.insert(host).values(hosts).onConflictDoNothing()
	await db.insert(listing).values(listings).onConflictDoNothing()
	await db.insert(listingTag).values(listingTags).onConflictDoNothing()

	console.log('Seeded plans and discovery fixtures')
} finally {
	await client.end({ timeout: 1 })
}
