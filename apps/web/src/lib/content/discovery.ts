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
	coverImageUrl?: string
	coverImageAlt?: string
	hostName: string
	hostSlug: string
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
	place?: string | null
	lat?: string | null
	lng?: string | null
	date?: string | null
	q?: string | null
	tag?: string | null
	type?: string | null
	radius?: string | null
}

export type DiscoveryDateFilter = 'all' | 'today' | 'tomorrow' | 'this_weekend' | 'next_7_days'

export type DiscoveryCenterOverride = Pick<
	DiscoveryCenter,
	'label' | 'latitude' | 'longitude' | 'zoom' | 'description'
>

export type DiscoveryTagOption = {
	value: string
	label: string
	count: number
}

const DISCOVERY_TIME_ZONE = 'America/Chicago'

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

export const dateFilterOptions: Array<{ value: DiscoveryDateFilter; label: string }> = [
	{ value: 'all', label: 'Any date' },
	{ value: 'today', label: 'Today' },
	{ value: 'tomorrow', label: 'Tomorrow' },
	{ value: 'this_weekend', label: 'This weekend' },
	{ value: 'next_7_days', label: 'Next 7 days' },
]

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

export function getDateFilterLabel(dateFilter: DiscoveryDateFilter) {
	return dateFilterOptions.find((option) => option.value === dateFilter)?.label ?? 'Any date'
}

function normalizeTag(tag: string) {
	return tag.trim().toLowerCase()
}

export function formatTagLabel(tag: string) {
	return tag
		.trim()
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

function getTagOptions(listings: DiscoveryListing[], selectedTag: string): DiscoveryTagOption[] {
	const counts = new Map<string, { label: string; count: number }>()

	for (const listing of listings) {
		for (const tag of listing.tags) {
			const normalizedTag = normalizeTag(tag)

			if (!normalizedTag) {
				continue
			}

			const current = counts.get(normalizedTag)
			counts.set(normalizedTag, {
				label: current?.label ?? formatTagLabel(tag),
				count: (current?.count ?? 0) + 1,
			})
		}
	}

	const options = [...counts.entries()]
		.map(([value, entry]) => ({
			value,
			label: entry.label,
			count: entry.count,
		}))
		.sort((left, right) => {
			if (left.count !== right.count) {
				return right.count - left.count
			}

			return left.label.localeCompare(right.label)
		})

	if (!selectedTag) {
		return options.slice(0, 8)
	}

	const selectedOption = options.find((option) => option.value === selectedTag)
	const visibleOptions = options.filter((option) => option.value !== selectedTag).slice(0, 7)

	return selectedOption ? [selectedOption, ...visibleOptions] : visibleOptions
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

export function createDiscoveryCenterOverride(input: DiscoveryCenterOverride): DiscoveryCenter {
	return {
		key: 'searched-location',
		city: input.label,
		region: '',
		...input,
	}
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

function getZonedDateParts(date: Date) {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: DISCOVERY_TIME_ZONE,
		weekday: 'short',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})

	const parts = formatter.formatToParts(date)
	const values = Object.fromEntries(
		parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
	) as Record<'weekday' | 'year' | 'month' | 'day', string>

	return {
		weekday: values.weekday,
		dateKey: `${values.year}-${values.month}-${values.day}`,
	}
}

function addDaysToDateKey(dateKey: string, days: number) {
	const [year, month, day] = dateKey.split('-').map(Number)
	const date = new Date(Date.UTC(year, month - 1, day + days))

	return date.toISOString().slice(0, 10)
}

function getWeekendDateKeys(now: Date) {
	const { dateKey, weekday } = getZonedDateParts(now)
	const weekdayIndexMap = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	} as const
	const weekdayIndex = weekdayIndexMap[weekday as keyof typeof weekdayIndexMap] ?? 5

	const fridayOffset = weekdayIndex === 0 ? -2 : 5 - weekdayIndex
	const friday = addDaysToDateKey(dateKey, fridayOffset)

	return new Set([friday, addDaysToDateKey(friday, 1), addDaysToDateKey(friday, 2)])
}

function getRollingDateKeys(now: Date, length: number) {
	const startDateKey = getZonedDateParts(now).dateKey

	return new Set(Array.from({ length }, (_, index) => addDaysToDateKey(startDateKey, index)))
}

function matchesDateFilter(startAt: string, dateFilter: DiscoveryDateFilter, now: Date) {
	if (dateFilter === 'all') {
		return true
	}

	const currentDateKey = getZonedDateParts(now).dateKey
	const listingDateKey = getZonedDateParts(new Date(startAt)).dateKey

	if (dateFilter === 'today') {
		return listingDateKey === currentDateKey
	}

	if (dateFilter === 'tomorrow') {
		return listingDateKey === addDaysToDateKey(currentDateKey, 1)
	}

	if (dateFilter === 'next_7_days') {
		return getRollingDateKeys(now, 7).has(listingDateKey)
	}

	return getWeekendDateKeys(now).has(listingDateKey)
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
			hostSlug: 'cherrywood-neighbors',
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
			hostSlug: 'hill-country-estate-co',
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
			hostSlug: 'mercado-club',
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
			hostSlug: 'mercado-club',
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
			hostSlug: 'cherrywood-neighbors',
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
			hostSlug: 'round-rock-neighbors',
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
			hostSlug: 'downtown-round-rock-alliance',
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
			hostSlug: 'old-oak-barn',
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
			hostSlug: 'front-yard-collective',
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
	now = new Date(),
	centerOverride?: DiscoveryCenterOverride | null
) {
	const center = centerOverride
		? createDiscoveryCenterOverride(centerOverride)
		: getDiscoveryCenter(filters.near)
	const activeDate = dateFilterOptions.some((option) => option.value === filters.date)
		? (filters.date as DiscoveryDateFilter)
		: 'all'
	const query = filters.q?.trim().toLowerCase() ?? ''
	const place = filters.place?.trim() ?? ''
	const activeTag = normalizeTag(filters.tag ?? '')
	const activeType = eventTypeOptions.some((option) => option.value === filters.type)
		? (filters.type as 'all' | DiscoveryEventType)
		: 'all'
	const radiusMiles = radiusOptions.includes(Number(filters.radius)) ? Number(filters.radius) : 15

	const listingsInContext = sourceListings
		.filter((listing) => {
			if (activeType !== 'all' && listing.eventType !== activeType) {
				return false
			}

			return true
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

	const listingsMatchingSearch = listingsInContext.filter((listing) => {
		if (activeTag && !listing.tags.some((tag) => normalizeTag(tag) === activeTag)) {
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

	const tagOptions = getTagOptions(
		listingsInContext.filter((listing) => matchesDateFilter(listing.startsAt, activeDate, now)),
		activeTag
	)

	const dateOptions = dateFilterOptions.map((option) => ({
		...option,
		count:
			option.value === 'all'
				? listingsMatchingSearch.length
				: listingsMatchingSearch.filter((listing) =>
						matchesDateFilter(listing.startsAt, option.value, now)
					).length,
	}))

	const listings = listingsMatchingSearch
		.filter((listing) => matchesDateFilter(listing.startsAt, activeDate, now))
		.sort((left, right) => {
			if (left.isFeatured !== right.isFeatured) {
				return Number(right.isFeatured) - Number(left.isFeatured)
			}

			if (Math.abs(left.distanceMiles - right.distanceMiles) > 0.25) {
				return left.distanceMiles - right.distanceMiles
			}

			return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
		})

	return {
		center,
		filters: {
			near: centerOverride ? null : center.key,
			place,
			latitude: centerOverride ? String(center.latitude) : '',
			longitude: centerOverride ? String(center.longitude) : '',
			date: activeDate,
			q: filters.q?.trim() ?? '',
			tag: activeTag,
			type: activeType,
			radiusMiles,
		},
		listings,
		locationOptions: discoveryCenters,
		dateOptions,
		tagOptions,
		typeOptions: eventTypeOptions,
		radiusOptions,
		stats: {
			matching: listings.length,
			featured: listings.filter((listing) => listing.isFeatured).length,
			thisWeekend: listingsMatchingSearch.filter((listing) =>
				matchesDateFilter(listing.startsAt, 'this_weekend', now)
			).length,
			tomorrow: listingsMatchingSearch.filter((listing) =>
				matchesDateFilter(listing.startsAt, 'tomorrow', now)
			).length,
			next7Days: listingsMatchingSearch.filter((listing) =>
				matchesDateFilter(listing.startsAt, 'next_7_days', now)
			).length,
		},
	}
}

export function getDiscoveryResults(
	filters: DiscoveryFilters,
	centerOverride?: DiscoveryCenterOverride | null
) {
	const now = new Date()

	return buildDiscoveryResults(filters, getSampleListings(now), now, centerOverride)
}
