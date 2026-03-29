export type DiscoveryEventType =
	| 'yard_sale'
	| 'garage_sale'
	| 'estate_sale'
	| 'flea_market'
	| 'pop_up_market'
	| 'community_sale'
	| 'other'

export type DiscoveryCenter = {
	key: string
	label: string
	city: string
	region: string
	latitude: number
	longitude: number
	zoom: number
	description: string
}

export type DiscoveryListing = {
	id: string
	slug: string
	title: string
	description: string
	hostName: string
	eventType: DiscoveryEventType
	locationLabel: string
	city: string
	region: string
	latitude: number
	longitude: number
	priceSummary: string
	tags: string[]
	isFeatured: boolean
	startsAt: string
	endsAt?: string
	mood: 'sunrise' | 'market' | 'garden' | 'night'
}

export type DiscoveryFilters = {
	near?: string | null
	q?: string | null
	type?: string | null
	radius?: string | null
}

const DAY = 24 * 60 * 60 * 1000

export const discoveryCenters: DiscoveryCenter[] = [
	{
		key: 'east-austin',
		label: 'East Austin',
		city: 'Austin',
		region: 'TX',
		latitude: 30.26683,
		longitude: -97.71623,
		zoom: 11.6,
		description: 'Creative neighborhoods, weekend yard sales, and pop-up vendor courts.',
	},
	{
		key: 'south-congress',
		label: 'South Congress',
		city: 'Austin',
		region: 'TX',
		latitude: 30.25024,
		longitude: -97.7495,
		zoom: 11.7,
		description: 'Vintage-heavy blocks with easy biking distance between stops.',
	},
	{
		key: 'cedar-park',
		label: 'Cedar Park',
		city: 'Cedar Park',
		region: 'TX',
		latitude: 30.5052,
		longitude: -97.82029,
		zoom: 10.7,
		description: 'Neighborhood sale clusters, school fundraisers, and broad driveway setups.',
	},
	{
		key: 'round-rock',
		label: 'Round Rock',
		city: 'Round Rock',
		region: 'TX',
		latitude: 30.50826,
		longitude: -97.6789,
		zoom: 10.7,
		description: 'Family-focused community sales and weekend flea finds north of town.',
	},
]

export const radiusOptions = [5, 10, 15, 25, 50]

export const eventTypeOptions: Array<{ value: 'all' | DiscoveryEventType; label: string }> = [
	{ value: 'all', label: 'All events' },
	{ value: 'yard_sale', label: 'Yard sales' },
	{ value: 'estate_sale', label: 'Estate sales' },
	{ value: 'flea_market', label: 'Flea markets' },
	{ value: 'pop_up_market', label: 'Pop-ups' },
	{ value: 'community_sale', label: 'Community sales' },
]

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

function toIso(date: Date) {
	return date.toISOString()
}

export function getEventTypeLabel(eventType: DiscoveryEventType) {
	return eventTypeOptions.find((option) => option.value === eventType)?.label ?? 'Local event'
}

export function getDiscoveryMood(
	listing: Pick<DiscoveryListing, 'eventType' | 'isFeatured' | 'startsAt'>
) {
	const hour = new Date(listing.startsAt).getHours()

	if (hour >= 16) {
		return 'night'
	}

	if (listing.isFeatured || listing.eventType === 'estate_sale') {
		return 'garden'
	}

	if (listing.eventType === 'flea_market' || listing.eventType === 'pop_up_market') {
		return 'market'
	}

	return 'sunrise'
}

export function getDiscoveryCenter(key?: string | null) {
	return discoveryCenters.find((center) => center.key === key) ?? discoveryCenters[0]
}

export function milesBetween(
	latitudeA: number,
	longitudeA: number,
	latitudeB: number,
	longitudeB: number
) {
	const earthRadiusMiles = 3958.8
	const toRadians = (value: number) => (value * Math.PI) / 180

	const latitudeDelta = toRadians(latitudeB - latitudeA)
	const longitudeDelta = toRadians(longitudeB - longitudeA)
	const startLatitude = toRadians(latitudeA)
	const endLatitude = toRadians(latitudeB)

	const haversineValue =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2

	return 2 * earthRadiusMiles * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
}

export function getSampleListings(now = new Date()): DiscoveryListing[] {
	const saturdayMorning = nextOccurrence(now, 6, 8)
	const saturdayNoon = nextOccurrence(now, 6, 12)
	const saturdayAfternoon = nextOccurrence(now, 6, 15)
	const sundayMorning = nextOccurrence(now, 0, 9)
	const sundayAfternoon = nextOccurrence(now, 0, 13)
	const fridayEvening = nextOccurrence(now, 5, 16)

	return [
		{
			id: 'cherrywood-porch-sale',
			slug: 'cherrywood-porch-sale',
			title: 'Cherrywood Porch Sale Crawl',
			description:
				'Multi-home porch sale with records, art books, small furniture, and kitchen finds.',
			hostName: 'Cherrywood Neighbors',
			eventType: 'yard_sale',
			locationLabel: 'Maplewood Ave & E 38 1/2 St',
			city: 'Austin',
			region: 'TX',
			latitude: 30.2882,
			longitude: -97.7184,
			priceSummary: 'Most items $2-$40',
			tags: ['records', 'home decor', 'books'],
			isFeatured: true,
			startsAt: toIso(saturdayMorning),
			endsAt: toIso(addHours(saturdayMorning, 6)),
			mood: 'sunrise',
		},
		{
			id: 'tarrytown-estate-edit',
			slug: 'tarrytown-estate-edit',
			title: 'Tarrytown Estate Edit',
			description:
				'Curated estate sale with teak furniture, glassware, framed art, and garage tools.',
			hostName: 'Hill Country Estate Co.',
			eventType: 'estate_sale',
			locationLabel: 'Scenic Dr near Enfield Rd',
			city: 'Austin',
			region: 'TX',
			latitude: 30.2987,
			longitude: -97.7827,
			priceSummary: 'Collector pieces and household lots',
			tags: ['furniture', 'art', 'tools'],
			isFeatured: true,
			startsAt: toIso(saturdayMorning),
			endsAt: toIso(addHours(saturdayMorning, 7)),
			mood: 'garden',
		},
		{
			id: 'eastside-vintage-pop-up',
			slug: 'eastside-vintage-pop-up',
			title: 'Eastside Vintage Pop-Up',
			description:
				'Rotating racks of vintage denim, handmade jewelry, ceramics, and fresh pastries.',
			hostName: 'Mercado Club',
			eventType: 'pop_up_market',
			locationLabel: 'Springdale Station',
			city: 'Austin',
			region: 'TX',
			latitude: 30.2816,
			longitude: -97.6835,
			priceSummary: 'Vintage and maker goods',
			tags: ['vintage', 'jewelry', 'food'],
			isFeatured: false,
			startsAt: toIso(saturdayNoon),
			endsAt: toIso(addHours(saturdayNoon, 5)),
			mood: 'market',
		},
		{
			id: 'mueller-morning-market',
			slug: 'mueller-morning-market',
			title: 'Mueller Morning Market',
			description:
				'Open-air flea blend with plants, vintage lamps, records, and neighborhood bakers.',
			hostName: 'Mueller Makers Row',
			eventType: 'flea_market',
			locationLabel: 'Aldrich St Plaza',
			city: 'Austin',
			region: 'TX',
			latitude: 30.3009,
			longitude: -97.7052,
			priceSummary: 'Browse all morning',
			tags: ['plants', 'lamps', 'records'],
			isFeatured: false,
			startsAt: toIso(sundayMorning),
			endsAt: toIso(addHours(sundayMorning, 4)),
			mood: 'sunrise',
		},
		{
			id: 'south-congress-garage-sale',
			slug: 'south-congress-garage-sale',
			title: 'South Congress Garage Sale Block',
			description:
				'Family garage sale block with bikes, games, patio gear, and back-to-school finds.',
			hostName: 'Travis Heights Homes',
			eventType: 'garage_sale',
			locationLabel: 'Fairmount Ave',
			city: 'Austin',
			region: 'TX',
			latitude: 30.2451,
			longitude: -97.7437,
			priceSummary: 'Bundle deals all day',
			tags: ['family', 'outdoor', 'kids'],
			isFeatured: false,
			startsAt: toIso(saturdayMorning),
			endsAt: toIso(addHours(saturdayMorning, 5)),
			mood: 'garden',
		},
		{
			id: 'cedar-park-community-sale',
			slug: 'cedar-park-community-sale',
			title: 'Cedar Park Community Sale',
			description:
				'One-stop neighborhood sale with strollers, patio sets, power tools, and sports gear.',
			hostName: 'Brushy Creek PTA',
			eventType: 'community_sale',
			locationLabel: 'Lakeline Park Pavilion',
			city: 'Cedar Park',
			region: 'TX',
			latitude: 30.5138,
			longitude: -97.8345,
			priceSummary: 'Family-friendly all morning',
			tags: ['community', 'tools', 'sports'],
			isFeatured: true,
			startsAt: toIso(saturdayMorning),
			endsAt: toIso(addHours(saturdayMorning, 4)),
			mood: 'market',
		},
		{
			id: 'round-rock-night-market',
			slug: 'round-rock-night-market',
			title: 'Round Rock Night Market',
			description:
				'Food trucks, handmade candles, secondhand fashion, and a late-evening vintage row.',
			hostName: 'Downtown Round Rock Alliance',
			eventType: 'pop_up_market',
			locationLabel: 'Prete Main St Plaza',
			city: 'Round Rock',
			region: 'TX',
			latitude: 30.5088,
			longitude: -97.6789,
			priceSummary: 'Late hours and easy parking',
			tags: ['food trucks', 'fashion', 'candles'],
			isFeatured: false,
			startsAt: toIso(fridayEvening),
			endsAt: toIso(addHours(fridayEvening, 5)),
			mood: 'night',
		},
		{
			id: 'buda-barn-treasure-sale',
			slug: 'buda-barn-treasure-sale',
			title: 'Buda Barn Treasure Sale',
			description: 'Big-lot sale with antique mirrors, iron patio pieces, farm tables, and linens.',
			hostName: 'Old Oak Barn',
			eventType: 'estate_sale',
			locationLabel: 'Old Black Colony Rd',
			city: 'Buda',
			region: 'TX',
			latitude: 30.0621,
			longitude: -97.8336,
			priceSummary: 'Antiques and oversized pieces',
			tags: ['antiques', 'patio', 'linens'],
			isFeatured: false,
			startsAt: toIso(sundayAfternoon),
			endsAt: toIso(addHours(sundayAfternoon, 4)),
			mood: 'garden',
		},
		{
			id: 'east-cesar-chavez-sidewalk-finds',
			slug: 'east-cesar-chavez-sidewalk-finds',
			title: 'East Cesar Chavez Sidewalk Finds',
			description:
				'Compact sidewalk setup with decor, old cameras, records, and small apartment furniture.',
			hostName: 'The Front Yard Collective',
			eventType: 'yard_sale',
			locationLabel: 'Pedernales St near Cesar Chavez',
			city: 'Austin',
			region: 'TX',
			latitude: 30.2535,
			longitude: -97.7194,
			priceSummary: 'Good quick stop under $25',
			tags: ['records', 'decor', 'cameras'],
			isFeatured: false,
			startsAt: toIso(saturdayAfternoon),
			endsAt: toIso(addHours(saturdayAfternoon, 3)),
			mood: 'sunrise',
		},
	]
}

export function buildDiscoveryResults(
	filters: DiscoveryFilters,
	sourceListings: DiscoveryListing[],
	now = new Date()
) {
	const center = getDiscoveryCenter(filters.near)
	const query = filters.q?.trim().toLowerCase() ?? ''
	const activeType = eventTypeOptions.some((option) => option.value === filters.type)
		? (filters.type as 'all' | DiscoveryEventType)
		: 'all'
	const radiusMiles = radiusOptions.includes(Number(filters.radius)) ? Number(filters.radius) : 15

	const listings = sourceListings
		.filter((listing) => {
			if (activeType !== 'all' && listing.eventType !== activeType) {
				return false
			}

			if (!query) {
				return true
			}

			const haystack = [
				listing.title,
				listing.description,
				listing.hostName,
				listing.locationLabel,
				listing.city,
				listing.region,
				...listing.tags,
			]
				.join(' ')
				.toLowerCase()

			return haystack.includes(query)
		})
		.map((listing) => ({
			...listing,
			distanceMiles: milesBetween(
				center.latitude,
				center.longitude,
				listing.latitude,
				listing.longitude
			),
		}))
		.filter((listing) => listing.distanceMiles <= radiusMiles)
		.sort((left, right) => {
			if (left.isFeatured !== right.isFeatured) {
				return Number(right.isFeatured) - Number(left.isFeatured)
			}

			if (Math.abs(left.distanceMiles - right.distanceMiles) > 0.25) {
				return left.distanceMiles - right.distanceMiles
			}

			return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
		})

	const weekendCutoff = now.getTime() + DAY * 3

	return {
		center,
		filters: {
			near: center.key,
			q: filters.q?.trim() ?? '',
			type: activeType,
			radiusMiles,
		},
		listings,
		locationOptions: discoveryCenters,
		typeOptions: eventTypeOptions,
		radiusOptions,
		stats: {
			matching: listings.length,
			featured: listings.filter((listing) => listing.isFeatured).length,
			thisWeekend: listings.filter(
				(listing) => new Date(listing.startsAt).getTime() <= weekendCutoff
			).length,
		},
	}
}

export function getDiscoveryResults(filters: DiscoveryFilters) {
	const now = new Date()

	return buildDiscoveryResults(filters, getSampleListings(now), now)
}
