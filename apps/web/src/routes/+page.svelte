<script lang="ts">
import { env as publicEnv } from '$env/dynamic/public'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Map as DiscoveryMap, MapControls, MapMarker, MarkerContent } from '$lib/components/ui/map'
import { Separator } from '$lib/components/ui/separator'
import { Skeleton } from '$lib/components/ui/skeleton'
import { siteConfig } from '$lib/config/site'
import { getEventTypeLabel, milesBetween } from '$lib/content/discovery'
import { cn } from '$lib/utils'
import ArrowRight from '@lucide/svelte/icons/arrow-right'
import CalendarDays from '@lucide/svelte/icons/calendar-days'
import Compass from '@lucide/svelte/icons/compass'
import MapPinned from '@lucide/svelte/icons/map-pinned'
import Search from '@lucide/svelte/icons/search'
import Sparkles from '@lucide/svelte/icons/sparkles'
import Store from '@lucide/svelte/icons/store'
import type { PageData } from './$types'

const { data } = $props<{ data: PageData }>()

type DiscoveryListing = PageData['listings'][number]

const moodClasses: Record<DiscoveryListing['mood'], string> = {
	sunrise: 'from-amber-200 via-orange-100 to-white',
	market: 'from-emerald-200 via-emerald-50 to-white',
	garden: 'from-lime-200 via-stone-50 to-white',
	night: 'from-slate-900 via-slate-700 to-slate-500 text-white',
}

const mapStyles = publicEnv.PUBLIC_MAP_STYLE_URL
	? { light: publicEnv.PUBLIC_MAP_STYLE_URL, dark: publicEnv.PUBLIC_MAP_STYLE_URL }
	: undefined

let selectedSlug = $state<string | null>(null)
// biome-ignore lint/style/useConst: state changes via button interactions in the template
let mobileView = $state<'map' | 'list'>('map')
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

const selectedListing = $derived(
	data.listings.find((listing: DiscoveryListing) => listing.slug === selectedSlug) ??
		data.listings[0] ??
		null
)

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

function selectListing(listing: DiscoveryListing) {
	selectedSlug = listing.slug
	mapViewport = {
		...mapViewport,
		center: [listing.longitude, listing.latitude],
		zoom: Math.max(mapViewport.zoom, 12.6),
	}
}

function handleLocate(coords: { longitude: number; latitude: number }) {
	mapViewport = {
		...mapViewport,
		center: [coords.longitude, coords.latitude],
		zoom: 12.8,
	}
}

function buildQuery(
	overrides: Partial<Record<'near' | 'type' | 'radius' | 'q', string | number | null>>
) {
	const params = new URLSearchParams()
	const next = {
		near: data.filters.near,
		type: data.filters.type,
		radius: String(data.filters.radiusMiles),
		q: data.filters.q,
		...overrides,
	}

	if (next.near) {
		params.set('near', String(next.near))
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

const highlightedListing = $derived(selectedListing ?? visibleListings[0] ?? null)
</script>

<svelte:head>
	<title>Hidden Gems</title>
	<meta name="description" content={siteConfig.description} />
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
			<form method="GET" class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
				<input type="hidden" name="near" value={data.filters.near} />
				<input type="hidden" name="type" value={data.filters.type} />
				<input type="hidden" name="radius" value={data.filters.radiusMiles} />
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

			<div class="grid gap-3 md:grid-cols-3">
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">
						Matching now
					</p>
					<p class="mt-2 font-display text-3xl text-ink-950">{data.stats.matching}</p>
					<p class="mt-1 text-sm text-ink-700">Within {data.filters.radiusMiles} miles.</p>
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
				{#each data.locationOptions as location}
					<Button
						href={buildQuery({ near: location.key })}
						variant={location.key === data.filters.near ? 'default' : 'outline'}
						size="sm"
						class="rounded-full"
					>
						{location.label}
					</Button>
				{/each}
			</div>

			<div class="flex flex-wrap gap-2">
				{#each data.typeOptions as option}
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
				{#each data.radiusOptions as radiusMiles}
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

{#snippet mapPanel()}
	<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
		<CardHeader>
			<div class="flex items-center justify-between gap-3">
				<div>
					<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
						<MapPinned class="size-5 text-coral-500" />
						Map nearby
					</CardTitle>
					<CardDescription class="mt-1">
						Tap a pin or card to lock onto a promising stop.
					</CardDescription>
				</div>
				{#if highlightedListing}
					<Badge class="bg-ink-950 text-mist-100">{highlightedListing.locationLabel}</Badge>
				{/if}
			</div>
		</CardHeader>
		<CardContent class="px-4 pb-4 sm:px-6 sm:pb-6">
			<div class="relative overflow-hidden rounded-[1.5rem] border border-ink-950/8 bg-white">
				<div class="h-[380px] sm:h-[460px]">
					<DiscoveryMap
						styles={mapStyles}
						viewport={mapViewport}
						onviewportchange={(viewport) => {
							mapViewport = viewport
						}}
						options={{
							attributionControl: false,
						}}
					>
						{#each visibleListings as listing (listing.slug)}
							<MapMarker
								longitude={listing.longitude}
								latitude={listing.latitude}
								onclick={() => selectListing(listing)}
							>
								<MarkerContent>
									<button
										type="button"
										class={cn(
											'flex min-w-[5.25rem] items-center justify-center rounded-full border border-white px-3 py-2 text-xs font-semibold shadow-lg transition-all',
											listing.slug === selectedSlug
												? 'bg-ink-950 text-white'
												: 'bg-white/95 text-ink-950 hover:bg-mist-100'
										)}
										aria-label={`Focus ${listing.title}`}
									>
										{formatDistance(listing.liveDistanceMiles)}
									</button>
								</MarkerContent>
							</MapMarker>
						{/each}
						<MapControls showZoom showLocate onlocate={handleLocate} />
					</DiscoveryMap>
				</div>

				{#if highlightedListing}
					<div class="pointer-events-none absolute inset-x-4 bottom-4">
						<div class="rounded-2xl border border-white/85 bg-white/92 p-4 shadow-xl backdrop-blur">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">
										Selected stop
									</p>
									<p class="mt-1 text-lg font-semibold text-ink-950">
										{highlightedListing.title}
									</p>
								</div>
								<Badge variant="outline">{getEventTypeLabel(highlightedListing.eventType)}</Badge>
							</div>
							<div class="mt-3 flex flex-wrap gap-3 text-sm text-ink-700">
								<span class="inline-flex items-center gap-1.5">
									<Compass class="size-4 text-ink-700/60" />
									{formatDistance(highlightedListing.liveDistanceMiles)}
								</span>
								<span class="inline-flex items-center gap-1.5">
									<CalendarDays class="size-4 text-ink-700/60" />
									{formatDateRange(highlightedListing.startsAt, highlightedListing.endsAt)}
								</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
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
				{#if data.filters.type !== 'all'}
					<Badge variant="outline">{getEventTypeLabel(data.filters.type)}</Badge>
				{/if}
			</div>

			{#if visibleListings.length === 0}
				<div class="rounded-[1.5rem] border border-dashed border-ink-950/15 bg-mist-100/70 p-6 text-sm text-ink-700">
					<p class="text-base font-semibold text-ink-950">Nothing matched this mix yet.</p>
					<p class="mt-2 leading-7">
						Try widening the radius, switching neighborhoods, or clearing the search phrase.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
						<Button href={buildQuery({ q: null, type: null, radius: 25 })} size="sm">
							Reset filters
						</Button>
					</div>
				</div>
			{:else}
				<div class="space-y-3">
					{#each visibleListings as listing (listing.slug)}
						<button
							type="button"
							onclick={() => selectListing(listing)}
							class={cn(
								'block w-full rounded-[1.5rem] border border-transparent text-left transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ink-950/20 focus-visible:outline-none',
								listing.slug === selectedSlug && 'ring-2 ring-ink-950/14'
							)}
						>
							<Card class="border-ink-950/8 bg-white shadow-sm">
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
									<div class="flex flex-wrap gap-2">
										{#each listing.tags as tag}
											<Badge variant="secondary">{tag}</Badge>
										{/each}
									</div>
								</CardContent>
							</Card>
						</button>
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
				<CardTitle class="text-xl text-ink-950">Coming next</CardTitle>
				<CardDescription>Host onboarding and first-listing publish tools.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3 px-4 pb-5 sm:px-6">
				<Skeleton class="h-4 w-28" />
				<Skeleton class="h-16 w-full rounded-2xl" />
				<Skeleton class="h-16 w-full rounded-2xl" />
				<Skeleton class="h-10 w-full rounded-full" />
			</CardContent>
		</Card>
	</section>
</div>
