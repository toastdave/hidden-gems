<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import {
	Map as DiscoveryMap,
	MapControls,
	MapMarker,
	type MapViewport,
	MarkerContent,
} from '$lib/components/ui/map'
import { type DiscoveryEventType, getEventTypeLabel } from '$lib/content/discovery'
import { cn } from '$lib/utils'
import CalendarDays from '@lucide/svelte/icons/calendar-days'
import Compass from '@lucide/svelte/icons/compass'
import MapPinned from '@lucide/svelte/icons/map-pinned'

type MapListing = {
	slug: string
	title: string
	latitude: number
	longitude: number
	liveDistanceMiles: number
	coverImageUrl?: string
	coverImageAlt?: string
	eventType: DiscoveryEventType
	startsAt: string
	endsAt?: string
	hostSlug: string
	locationLabel: string
}

const {
	mapStyles,
	viewport,
	listings,
	selectedSlug,
	highlightedListing,
	onselectlisting,
	onviewportchange,
	onlocate,
	onlocateerror,
}: {
	mapStyles?: { light?: string; dark?: string }
	viewport: MapViewport
	listings: MapListing[]
	selectedSlug: string | null
	highlightedListing: MapListing | null
	onselectlisting?: (listing: MapListing) => void
	onviewportchange?: (viewport: MapViewport) => void
	onlocate?: (coords: { longitude: number; latitude: number }) => void
	onlocateerror?: (message: string) => void
} = $props()

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
</script>

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
					viewport={viewport}
					onviewportchange={onviewportchange}
					options={{
						attributionControl: false,
					}}
				>
					{#each listings as listing (listing.slug)}
						<MapMarker
							longitude={listing.longitude}
							latitude={listing.latitude}
							onclick={() => onselectlisting?.(listing)}
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
					<MapControls
						showZoom
						showLocate
						onlocate={onlocate}
						onlocateerror={onlocateerror}
					/>
				</DiscoveryMap>
			</div>

			{#if highlightedListing}
				<div class="pointer-events-none absolute inset-x-4 bottom-4">
					<div class="rounded-2xl border border-white/85 bg-white/92 p-4 shadow-xl backdrop-blur">
						<div class="flex items-start justify-between gap-3">
							<div class="flex min-w-0 items-start gap-3">
								{#if highlightedListing.coverImageUrl}
									<img
										src={highlightedListing.coverImageUrl}
										alt={highlightedListing.coverImageAlt || highlightedListing.title}
										class="size-16 rounded-2xl object-cover"
									/>
								{/if}
								<div class="min-w-0">
									<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">
										Selected stop
									</p>
									<p class="mt-1 text-lg font-semibold text-ink-950">
										{highlightedListing.title}
									</p>
								</div>
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
						<div class="pointer-events-auto mt-4 flex flex-wrap gap-2">
							<Button href={`/sale/${highlightedListing.slug}`} size="sm" class="rounded-full">
								Open listing
							</Button>
							<Button
								href={`/hosts/${highlightedListing.hostSlug}`}
								variant="outline"
								size="sm"
								class="rounded-full"
							>
								View host
							</Button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</CardContent>
</Card>
