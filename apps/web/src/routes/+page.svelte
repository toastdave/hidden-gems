<script lang="ts">
import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { env as publicEnv } from '$env/dynamic/public'
import SaveSearchAlertButton from '$lib/components/alerts/save-search-alert-button.svelte'
import LocationAutocomplete from '$lib/components/discovery/location-autocomplete.svelte'
import FavoriteToggleButton from '$lib/components/engagement/favorite-toggle-button.svelte'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Separator } from '$lib/components/ui/separator'
import { Skeleton } from '$lib/components/ui/skeleton'
import { siteConfig } from '$lib/config/site'
import { getDateFilterLabel, getEventTypeLabel, milesBetween } from '$lib/content/discovery'
import { buildAbsoluteUrl, resolveMetaImageUrl } from '$lib/seo'
import { cn } from '$lib/utils'
import ArrowRight from '@lucide/svelte/icons/arrow-right'
import CalendarDays from '@lucide/svelte/icons/calendar-days'
import MapPinned from '@lucide/svelte/icons/map-pinned'
import Search from '@lucide/svelte/icons/search'
import Sparkles from '@lucide/svelte/icons/sparkles'
import Store from '@lucide/svelte/icons/store'
import { onMount } from 'svelte'
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

type DiscoveryListing = PageData['listings'][number]
type HomepageMapPanelModule = typeof import('$lib/components/discovery/homepage-map-panel.svelte')

const moodClasses: Record<DiscoveryListing['mood'], string> = {
	sunrise: 'from-amber-200 via-orange-100 to-white',
	market: 'from-emerald-200 via-emerald-50 to-white',
	garden: 'from-lime-200 via-stone-50 to-white',
	night: 'from-slate-900 via-slate-700 to-slate-500 text-white',
}

const mapStyles = publicEnv.PUBLIC_MAP_STYLE_URL
	? { light: publicEnv.PUBLIC_MAP_STYLE_URL, dark: publicEnv.PUBLIC_MAP_STYLE_URL }
	: undefined

let homepageMapPanelPromise = $state<Promise<HomepageMapPanelModule> | null>(null)
let selectedSlug = $state<string | null>(null)
// biome-ignore lint/style/useConst: state changes via button interactions in the template
let mobileView = $state<'map' | 'list'>('map')
let locationFeedback = $state<string | null>(null)
let mapViewport = $state({
	center: [0, 0] as [number, number],
	zoom: 0,
	bearing: 0,
	pitch: 0,
})

$effect(() => {
	selectedSlug = data.listings[0]?.slug ?? null
	mapViewport = {
		center: [data.center.longitude, data.center.latitude],
		zoom: data.center.zoom,
		bearing: 0,
		pitch: 0,
	}
})

function ensureHomepageMapPanel() {
	if (!browser || homepageMapPanelPromise) {
		return
	}

	homepageMapPanelPromise = import('$lib/components/discovery/homepage-map-panel.svelte')
}

onMount(() => {
	if (!browser) {
		return
	}

	const timeoutId = window.setTimeout(() => {
		ensureHomepageMapPanel()
	}, 180)

	return () => {
		window.clearTimeout(timeoutId)
	}
})

const visibleListings = $derived.by<Array<DiscoveryListing & { liveDistanceMiles: number }>>(() => {
	const [longitude, latitude] = mapViewport.center

	return [...data.listings]
		.map((listing) => ({
			...listing,
			liveDistanceMiles: milesBetween(latitude, longitude, listing.latitude, listing.longitude),
		}))
		.sort((left, right) => {
			if (left.slug === selectedSlug) {
				return -1
			}

			if (right.slug === selectedSlug) {
				return 1
			}

			if (left.isFeatured !== right.isFeatured) {
				return Number(right.isFeatured) - Number(left.isFeatured)
			}

			if (Math.abs(left.liveDistanceMiles - right.liveDistanceMiles) > 0.2) {
				return left.liveDistanceMiles - right.liveDistanceMiles
			}

			return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
		})
})

function selectListing(listing: Pick<DiscoveryListing, 'slug' | 'longitude' | 'latitude'>) {
	selectedSlug = listing.slug
	mapViewport = {
		...mapViewport,
		center: [listing.longitude, listing.latitude],
		zoom: Math.max(mapViewport.zoom, 12.6),
	}
}

function handleLocate(coords: { longitude: number; latitude: number }) {
	locationFeedback = null
	void goto(
		buildQuery({
			near: null,
			place: 'Current location',
			lat: coords.latitude,
			lng: coords.longitude,
		})
	)
}

function handleLocateError(message: string) {
	locationFeedback = message
}

function buildQuery(
	overrides: Partial<
		Record<
			'near' | 'place' | 'lat' | 'lng' | 'date' | 'tag' | 'type' | 'radius' | 'q',
			string | number | null
		>
	>
) {
	const params = new URLSearchParams()
	const next = {
		near: data.filters.near,
		place: data.filters.place,
		lat: data.filters.latitude,
		lng: data.filters.longitude,
		date: data.filters.date,
		tag: data.filters.tag,
		type: data.filters.type,
		radius: String(data.filters.radiusMiles),
		q: data.filters.q,
		...overrides,
	}

	if (next.near) {
		params.set('near', String(next.near))
	}

	if (next.place) {
		params.set('place', String(next.place))
	}

	if (next.lat) {
		params.set('lat', String(next.lat))
	}

	if (next.lng) {
		params.set('lng', String(next.lng))
	}

	if (next.date && next.date !== 'all') {
		params.set('date', String(next.date))
	}

	if (next.tag) {
		params.set('tag', String(next.tag))
	}

	if (next.type && next.type !== 'all') {
		params.set('type', String(next.type))
	}

	if (next.radius) {
		params.set('radius', String(next.radius))
	}

	if (next.q) {
		params.set('q', String(next.q))
	}

	const query = params.toString()
	return query ? `/?${query}` : '/'
}

function formatDateRange(startAt: string, endAt?: string) {
	const start = new Date(startAt)
	const end = endAt ? new Date(endAt) : null

	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	})

	const timeFormatter = new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
	})

	const datePart = dateFormatter.format(start)
	const startTime = timeFormatter.format(start)

	if (!end) {
		return `${datePart} · ${startTime}`
	}

	return `${datePart} · ${startTime} - ${timeFormatter.format(end)}`
}

function formatDistance(distanceMiles: number) {
	if (distanceMiles < 0.15) {
		return 'Walkable'
	}

	if (distanceMiles < 10) {
		return `${distanceMiles.toFixed(1)} mi`
	}

	return `${Math.round(distanceMiles)} mi`
}

const highlightedListing = $derived(
	visibleListings.find((listing) => listing.slug === selectedSlug) ?? visibleListings[0] ?? null
)
const favoriteListingIds = $derived(new Set(data.favoriteListingIds))
const homepageTitle = $derived(
	data.filters.place
		? `${data.filters.place} yard sales, estate sales, and pop-up markets | ${siteConfig.name}`
		: `${siteConfig.name} | Yard sales, estate sales, and flea markets nearby`
)
const homepageDescription = $derived.by(() => {
	const eventCountLabel = `${data.stats.matching} local stop${data.stats.matching === 1 ? '' : 's'}`
	const placeLabel = data.filters.place || data.center.label
	const activeFilters = [
		data.filters.date !== 'all' ? getDateFilterLabel(data.filters.date) : null,
		data.filters.type !== 'all' ? getEventTypeLabel(data.filters.type) : null,
		data.filters.tag ? `tagged ${data.filters.tag}` : null,
	]
		.filter(Boolean)
		.join(', ')

	return activeFilters
		? `Browse ${eventCountLabel} around ${placeLabel} on Hidden Gems, filtered for ${activeFilters}.`
		: `Browse ${eventCountLabel} around ${placeLabel} on Hidden Gems and map out your next yard sale, estate sale, or flea market run.`
})
const homepageCanonicalUrl = $derived(
	buildAbsoluteUrl(publicEnv.PUBLIC_APP_URL, data.canonicalPath)
)
const homepageImageUrl = $derived(
	resolveMetaImageUrl(publicEnv.PUBLIC_APP_URL, highlightedListing?.coverImageUrl)
)
</script>

<svelte:head>
	<title>{homepageTitle}</title>
	<meta name="description" content={homepageDescription} />
	<link rel="canonical" href={homepageCanonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:title" content={homepageTitle} />
	<meta property="og:description" content={homepageDescription} />
	<meta property="og:url" content={homepageCanonicalUrl} />
	<meta name="twitter:card" content={homepageImageUrl ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={homepageTitle} />
	<meta name="twitter:description" content={homepageDescription} />
	{#if homepageImageUrl}
		<meta property="og:image" content={homepageImageUrl} />
		<meta property="og:image:alt" content={highlightedListing?.coverImageAlt || highlightedListing?.title || siteConfig.name} />
		<meta name="twitter:image" content={homepageImageUrl} />
	{/if}
</svelte:head>

{#snippet searchPanel()}
	<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
		<CardHeader class="gap-3">
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline" class="border-amber-300/80 bg-amber-100/70 text-amber-900">
					Near {data.center.label}
				</Badge>
				<Badge variant="outline" class="border-emerald-300/80 bg-emerald-100/70 text-emerald-900">
					{data.stats.thisWeekend} happening this weekend
				</Badge>
				<Badge variant="outline" class="border-sky-300/80 bg-sky-100/70 text-sky-900">
					{data.stats.tomorrow} worth checking tomorrow
				</Badge>
			</div>
			<CardTitle class="font-display text-3xl leading-tight text-ink-950 sm:text-4xl">
				The best yard sales, estate finds, and pop-up markets worth driving to.
			</CardTitle>
			<CardDescription class="max-w-2xl text-base leading-7 text-ink-700">
				Search by neighborhood, zoom the map, and build a weekend route around the most
				promising stops.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-5 px-4 pb-5 sm:px-6">
			<form method="GET" class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
				<input type="hidden" name="date" value={data.filters.date} />
				<input type="hidden" name="tag" value={data.filters.tag} />
				<input type="hidden" name="type" value={data.filters.type} />
				<input type="hidden" name="radius" value={data.filters.radiusMiles} />
				<div class="relative">
					<MapPinned class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-700/60" />
					<LocationAutocomplete
						nearName="near"
						latitudeName="lat"
						longitudeName="lng"
						name="place"
						value={data.filters.place}
						latitude={data.filters.latitude}
						longitude={data.filters.longitude}
						presetNear={data.filters.near ?? ''}
						proximityLatitude={data.center.latitude}
						proximityLongitude={data.center.longitude}
						placeholder="Search Austin, 78702, South Congress..."
						class="h-11 rounded-full border-white/70 bg-white pl-10 shadow-sm"
					/>
				</div>
				<div class="relative">
					<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-700/60" />
					<Input
						name="q"
						value={data.filters.q}
						placeholder="Search records, patio furniture, vintage denim, tools..."
						class="h-11 rounded-full border-white/70 bg-white pl-10 shadow-sm"
					/>
				</div>
				<Button type="submit" size="lg" class="rounded-full px-5">
					Search nearby
					<ArrowRight />
				</Button>
			</form>

			<p class="text-sm leading-6 text-ink-700/80">
				Type a neighborhood or ZIP code for quick suggestions, or press search to look up the full place.
			</p>

			{#if data.locationError || locationFeedback}
				<div class="rounded-2xl border border-coral-500/20 bg-coral-500/10 px-4 py-3 text-sm text-coral-600">
					{data.locationError ?? locationFeedback}
				</div>
			{/if}

			<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">
						Matching now
					</p>
					<p class="mt-2 font-display text-3xl text-ink-950">{data.stats.matching}</p>
					<p class="mt-1 text-sm text-ink-700">Within {data.filters.radiusMiles} miles.</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">
						Tomorrow
					</p>
					<p class="mt-2 font-display text-3xl text-ink-950">{data.stats.tomorrow}</p>
					<p class="mt-1 text-sm text-ink-700">Good for planning your next outing.</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">
						Featured picks
					</p>
					<p class="mt-2 font-display text-3xl text-ink-950">{data.stats.featured}</p>
					<p class="mt-1 text-sm text-ink-700">Great anchors for a day out.</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">
						Current focus
					</p>
					<p class="mt-2 text-lg font-semibold text-ink-950">{data.center.label}</p>
					<p class="mt-1 text-sm text-ink-700">{data.center.description}</p>
				</div>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each data.locationOptions as location (location.key)}
					<Button
						href={buildQuery({ near: location.key, place: null, lat: null, lng: null })}
						variant={location.key === data.filters.near ? 'default' : 'outline'}
						size="sm"
						class="rounded-full"
					>
						{location.label}
					</Button>
				{/each}
				{#if data.filters.place && !data.filters.near}
					<Button href={buildQuery({ place: null, lat: null, lng: null })} variant="secondary" size="sm" class="rounded-full">
						Clear searched place
					</Button>
				{/if}
			</div>

			<div class="flex flex-wrap gap-2">
				{#each data.dateOptions as option (option.value)}
					<Button
						href={buildQuery({ date: option.value === 'all' ? null : option.value })}
						variant={option.value === data.filters.date ? 'secondary' : 'ghost'}
						size="sm"
						class="rounded-full"
					>
						{option.label}
						<span class="text-ink-700/60">{option.count}</span>
					</Button>
				{/each}
			</div>

			<p class="text-sm leading-6 text-ink-700/80">
				Plan ahead with {data.stats.tomorrow} happening tomorrow and {data.stats.next7Days} across the next 7 days.
			</p>

			<div class="flex flex-wrap gap-2">
				{#each data.typeOptions as option (option.value)}
					<Button
						href={buildQuery({ type: option.value === 'all' ? null : option.value })}
						variant={option.value === data.filters.type ? 'secondary' : 'ghost'}
						size="sm"
						class="rounded-full"
					>
						{option.label}
					</Button>
				{/each}
			</div>

			<div class="flex flex-wrap gap-2">
				{#if data.tagOptions.length > 0}
					{#each data.tagOptions as option (option.value)}
						<Button
							href={buildQuery({ tag: option.value === data.filters.tag ? null : option.value })}
							variant={option.value === data.filters.tag ? 'outline' : 'ghost'}
							size="sm"
							class="rounded-full"
						>
							{option.label}
							<span class="text-ink-700/60">{option.count}</span>
						</Button>
					{/each}
				{/if}
			</div>

			<div class="flex flex-wrap gap-2">
				{#each data.radiusOptions as radiusMiles (radiusMiles)}
					<Button
						href={buildQuery({ radius: radiusMiles })}
						variant={radiusMiles === data.filters.radiusMiles ? 'outline' : 'ghost'}
						size="sm"
						class="rounded-full"
					>
						Within {radiusMiles} mi
					</Button>
				{/each}
			</div>
		</CardContent>
	</Card>
{/snippet}

{#snippet mapPanelFallback()}
	<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
		<CardHeader>
			<div class="flex items-center justify-between gap-3">
				<div>
					<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
						<MapPinned class="size-5 text-coral-500" />
						Map nearby
					</CardTitle>
					<CardDescription class="mt-1">
						Loading the interactive map after the first paint.
					</CardDescription>
				</div>
				<Badge class="bg-ink-950 text-mist-100">Preparing map</Badge>
			</div>
		</CardHeader>
		<CardContent class="px-4 pb-4 sm:px-6 sm:pb-6">
			<div class="overflow-hidden rounded-[1.5rem] border border-ink-950/8 bg-white p-4">
				<Skeleton class="h-[380px] w-full rounded-[1.25rem] sm:h-[460px]" />
				<div class="mt-4 flex flex-wrap gap-2">
					<Skeleton class="h-7 w-28 rounded-full" />
					<Skeleton class="h-7 w-24 rounded-full" />
				</div>
			</div>
		</CardContent>
	</Card>
{/snippet}

{#snippet mapPanel()}
	{#if homepageMapPanelPromise}
		{#await homepageMapPanelPromise}
			{@render mapPanelFallback()}
		{:then module}
			{@const HomepageMapPanel = module.default}
			<HomepageMapPanel
				mapStyles={mapStyles}
				viewport={mapViewport}
				listings={visibleListings}
				selectedSlug={selectedSlug}
				highlightedListing={highlightedListing}
				onselectlisting={selectListing}
				onviewportchange={(viewport) => {
					mapViewport = viewport
				}}
				onlocate={handleLocate}
				onlocateerror={handleLocateError}
			/>
		{:catch}
			{@render mapPanelFallback()}
		{/await}
	{:else}
		{@render mapPanelFallback()}
	{/if}
{/snippet}

{#snippet resultsPanel()}
	<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
		<CardHeader class="gap-3">
			<div class="flex items-start justify-between gap-3">
				<div>
					<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
						<Store class="size-5 text-leaf-400" />
						Nearby results
					</CardTitle>
					<CardDescription class="mt-1">
						Sorted around the part of the map you are currently exploring.
					</CardDescription>
				</div>
				<Button
					href={data.user ? '/host' : '/auth/sign-up?redirectTo=/host'}
					variant="outline"
					size="sm"
					class="rounded-full"
				>
					{data.user ? 'Host a sale' : 'Start hosting'}
				</Button>
			</div>
		</CardHeader>
		<CardContent class="px-4 pb-5 sm:px-6">
			<div class="mb-4 flex flex-wrap gap-2">
				<Badge class="bg-ink-950 text-mist-100">{visibleListings.length} stops in view</Badge>
				{#if data.filters.q}
					<Badge variant="outline">Searching for “{data.filters.q}”</Badge>
				{/if}
				{#if data.filters.tag}
					<Badge variant="outline">Tagged “{data.filters.tag}”</Badge>
				{/if}
				{#if data.filters.date !== 'all'}
					<Badge variant="outline">{getDateFilterLabel(data.filters.date)}</Badge>
				{/if}
				{#if data.filters.type !== 'all'}
					<Badge variant="outline">{getEventTypeLabel(data.filters.type)}</Badge>
				{/if}
			</div>

			{#if visibleListings.length === 0}
				<div class="rounded-[1.5rem] border border-dashed border-ink-950/15 bg-mist-100/70 p-6 text-sm text-ink-700">
					<p class="text-base font-semibold text-ink-950">Nothing matched this mix yet.</p>
					<p class="mt-2 leading-7">
						Try widening the radius, switching the date window, or clearing the search phrase.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
						<Button href={buildQuery({ q: null, date: null, tag: null, type: null, radius: 25 })} size="sm">
							Reset filters
						</Button>
					</div>
				</div>
			{:else}
				<div class="space-y-3">
					{#each visibleListings as listing (listing.slug)}
						<div
							class={cn(
								'block w-full rounded-[1.5rem] border border-transparent text-left transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ink-950/20 focus-visible:outline-none',
								listing.slug === selectedSlug && 'ring-2 ring-ink-950/14'
							)}
						>
							<Card class="border-ink-950/8 bg-white shadow-sm">
								<button type="button" class="block w-full text-left" onclick={() => selectListing(listing)}>
									{#if listing.coverImageUrl}
										<div class="relative min-h-36 overflow-hidden border-b border-ink-950/8">
										<img
											src={listing.coverImageUrl}
											alt={listing.coverImageAlt || listing.title}
											class="h-40 w-full object-cover"
										/>
										<div class="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent"></div>
											<div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 py-4 text-white">
												<div>
													<p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
														{listing.hostName}
													</p>
													<p class="mt-2 max-w-[16rem] text-xl font-semibold leading-tight">
														{listing.title}
													</p>
												</div>
												{#if listing.isFeatured}
													<Badge class="bg-ink-950 text-mist-100">
														<Sparkles class="mr-1 size-3.5" />
														Featured
													</Badge>
												{/if}
											</div>
										</div>
									{:else}
										<div
											class={cn(
												'flex min-h-28 items-end justify-between border-b border-ink-950/8 px-4 py-4 text-ink-950',
												`bg-gradient-to-br ${moodClasses[listing.mood]}`
											)}
										>
											<div>
												<p class="text-xs font-semibold uppercase tracking-[0.24em] text-ink-700/70">
													{listing.hostName}
												</p>
												<p class="mt-2 max-w-[16rem] text-xl font-semibold leading-tight">
													{listing.title}
												</p>
											</div>
											{#if listing.isFeatured}
												<Badge class="bg-ink-950 text-mist-100">
													<Sparkles class="mr-1 size-3.5" />
													Featured
												</Badge>
											{/if}
										</div>
									{/if}
									<CardContent class="space-y-3 px-4 py-4">
										<div class="flex flex-wrap items-center gap-2">
											<Badge variant="outline">{getEventTypeLabel(listing.eventType)}</Badge>
											<Badge variant="outline">{formatDistance(listing.liveDistanceMiles)}</Badge>
											<Badge variant="outline">{listing.priceSummary}</Badge>
										</div>
										<p class="line-clamp-2 text-sm leading-6 text-ink-700">
											{listing.description}
										</p>
										<div class="flex flex-wrap gap-3 text-sm text-ink-700">
											<span class="inline-flex items-center gap-1.5">
												<CalendarDays class="size-4 text-ink-700/60" />
												{formatDateRange(listing.startsAt, listing.endsAt)}
											</span>
											<span class="inline-flex items-center gap-1.5">
												<MapPinned class="size-4 text-ink-700/60" />
												{listing.locationLabel}
											</span>
										</div>
										<Separator />
									</CardContent>
								</button>
								<div class="flex flex-wrap gap-2 px-4 pb-4">
									<FavoriteToggleButton
										listingId={listing.id}
										initialActive={favoriteListingIds.has(listing.id)}
										signedIn={Boolean(data.user)}
										redirectTo={data.canonicalPath}
									/>
									<Button href={`/sale/${listing.slug}`} variant="secondary" size="sm" class="rounded-full">
										Open listing
									</Button>
									<Button href={`/hosts/${listing.hostSlug}`} variant="outline" size="sm" class="rounded-full">
										View host
									</Button>
								</div>
								<div class="flex flex-wrap gap-2 px-4 pb-4">
									{#each listing.tags as tag (`${listing.slug}-${tag}`)}
										<Badge variant="secondary">{tag}</Badge>
									{/each}
								</div>
							</Card>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
{/snippet}

<div class="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
	<header class="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-white/70 bg-white/72 px-4 py-3 shadow-[0_24px_64px_-48px_rgba(15,23,42,0.4)] backdrop-blur sm:px-5">
		<div class="flex items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-2xl bg-ink-950 text-mist-100">
				<MapPinned class="size-5" />
			</div>
			<div>
				<p class="font-display text-lg text-ink-950">{siteConfig.name}</p>
				<p class="text-sm text-ink-700">{siteConfig.tagline}</p>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<Badge variant="outline" class="hidden rounded-full bg-white/90 px-3 py-1 md:inline-flex">
				Weekend discovery
			</Badge>
			<Button
				href={data.user ? '/account' : '/auth/sign-in?redirectTo=/account'}
				variant="outline"
				size="sm"
				class="rounded-full"
			>
				{data.user ? 'Account' : 'Sign in'}
			</Button>
			<Button
				href={data.user ? '/host' : '/auth/sign-up?redirectTo=/host'}
				size="sm"
				class="rounded-full"
			>
				{data.user ? 'Host your next sale' : 'Create an account'}
			</Button>
		</div>
	</header>

	{@render searchPanel()}

	<section class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,440px)] lg:items-start">
		<div class="hidden lg:block">{@render mapPanel()}</div>
		<div class="hidden lg:block">{@render resultsPanel()}</div>

		<div class="lg:hidden">
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-2 rounded-full bg-white/82 p-1 shadow-sm">
					<Button
						type="button"
						variant={mobileView === 'map' ? 'default' : 'ghost'}
						class="rounded-full"
						onclick={() => {
							ensureHomepageMapPanel()
							mobileView = 'map'
						}}
					>
						Map
					</Button>
					<Button
						type="button"
						variant={mobileView === 'list' ? 'default' : 'ghost'}
						class="rounded-full"
						onclick={() => {
							mobileView = 'list'
						}}
					>
						Listings
					</Button>
				</div>

				{#if mobileView === 'map'}
					{@render mapPanel()}
				{:else}
					{@render resultsPanel()}
				{/if}
			</div>
		</div>
	</section>

	<section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
		<Card class="border-white/80 bg-ink-950 text-mist-100 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.55)]">
			<CardHeader>
				<CardTitle class="font-display text-2xl text-mist-100">
					Need a route for the rest of the weekend?
				</CardTitle>
				<CardDescription class="max-w-2xl text-mist-100/80">
					Start with featured stops, then zoom around the map to fill in smaller neighborhood
					finds nearby.
				</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-3 px-4 pb-5 sm:px-6 lg:grid-cols-3">
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="text-sm font-semibold text-mist-100">Start with anchor stops</p>
					<p class="mt-2 text-sm leading-6 text-mist-100/75">
						Featured estate sales and community markets give you the broadest payoff first.
					</p>
				</div>
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="text-sm font-semibold text-mist-100">Tighten the radius</p>
					<p class="mt-2 text-sm leading-6 text-mist-100/75">
						Switch to a 5 or 10 mile radius when you want a walkable cluster of quick hits.
					</p>
				</div>
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="text-sm font-semibold text-mist-100">Search by what you collect</p>
					<p class="mt-2 text-sm leading-6 text-mist-100/75">
						Use keywords like records, patio, vintage, plants, or tools to narrow fast.
					</p>
				</div>
			</CardContent>
		</Card>

		<Card class="border-white/80 bg-white/88 backdrop-blur">
			<CardHeader>
				<CardTitle class="text-xl text-ink-950">Save this search</CardTitle>
				<CardDescription>
					Keep this exact location, radius, type, and tag mix ready to revisit from your account.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3 px-4 pb-5 sm:px-6">
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4 text-sm leading-6 text-ink-700">
					This saves your current location, radius, event type, and tag filters. Keyword and date filters stay out of the alert for now.
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4 text-sm leading-6 text-ink-700">
					Saved-search matches now land in your account activity feed, and cadence preferences let you choose instant or daily checks.
				</div>
				<SaveSearchAlertButton
					locationLabel={data.center.label}
					latitude={data.center.latitude}
					longitude={data.center.longitude}
					radiusMiles={data.filters.radiusMiles}
					eventType={data.filters.type}
					tag={data.filters.tag}
					signedIn={Boolean(data.user)}
					initialSaved={data.hasSavedSearchAlert}
					redirectTo={data.canonicalPath}
				/>
			</CardContent>
		</Card>
	</section>
</div>
