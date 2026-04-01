<script lang="ts">
import { env as publicEnv } from '$env/dynamic/public'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { siteConfig } from '$lib/config/site'
import { getEventTypeLabel } from '$lib/content/discovery'
import { buildAbsoluteUrl, resolveMetaImageUrl } from '$lib/seo'
import CalendarDays from '@lucide/svelte/icons/calendar-days'
import Compass from '@lucide/svelte/icons/compass'
import MapPinned from '@lucide/svelte/icons/map-pinned'
import Sparkles from '@lucide/svelte/icons/sparkles'
import Store from '@lucide/svelte/icons/store'
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()

const pageTitle = $derived(`${data.listing.title} | ${siteConfig.name}`)
const pageDescription = $derived(
	data.listing.description ?? `${data.listing.title} in ${data.listing.locationLabel}`
)
const canonicalUrl = $derived(buildAbsoluteUrl(publicEnv.PUBLIC_APP_URL, data.canonicalPath))
const hostUrl = $derived(buildAbsoluteUrl(publicEnv.PUBLIC_APP_URL, `/hosts/${data.host.slug}`))
const metaImageUrl = $derived(resolveMetaImageUrl(publicEnv.PUBLIC_APP_URL, data.media[0]?.url))
const listingStructuredData = $derived.by(() =>
	JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: data.listing.title,
		description: pageDescription,
		startDate: new Date(data.listing.startAt).toISOString(),
		endDate: data.listing.endAt ? new Date(data.listing.endAt).toISOString() : undefined,
		eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
		eventStatus: 'https://schema.org/EventScheduled',
		url: canonicalUrl,
		image: data.media
			.map((media) => resolveMetaImageUrl(publicEnv.PUBLIC_APP_URL, media.url))
			.filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
		organizer: {
			'@type': 'Organization',
			name: data.host.displayName,
			url: hostUrl,
		},
		location: {
			'@type': 'Place',
			name: data.listing.locationLabel,
		},
	})
)

function formatDateRange(startAt: string | Date, endAt?: string | Date | null) {
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

	return end
		? `${datePart} · ${startTime} - ${timeFormatter.format(end)}`
		: `${datePart} · ${startTime}`
}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta name="twitter:card" content={metaImageUrl ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	{#if metaImageUrl}
		<meta property="og:image" content={metaImageUrl} />
		<meta property="og:image:alt" content={data.media[0]?.altText || data.listing.title} />
		<meta name="twitter:image" content={metaImageUrl} />
	{/if}
	<script type="application/ld+json">
		{listingStructuredData}
	</script>
</svelte:head>

<section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
	<div class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_340px]">
		<Card class="overflow-hidden border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
			{#if data.media.length > 0}
				<div class="grid gap-2 bg-mist-100/60 p-2 sm:grid-cols-[minmax(0,1fr)_160px]">
					<img
						src={data.media[0].url}
						alt={data.media[0].altText || data.listing.title}
						class="h-72 w-full rounded-[1.4rem] object-cover sm:h-80"
					/>
					<div class="grid grid-cols-3 gap-2 sm:grid-cols-1">
						{#each data.media.slice(1, 4) as media (media.id)}
							<img src={media.url} alt={media.altText || data.listing.title} class="h-24 w-full rounded-2xl object-cover sm:h-full" />
						{/each}
					</div>
				</div>
			{/if}
			<div class="flex min-h-56 items-end justify-between bg-gradient-to-br from-amber-200 via-orange-100 to-white px-5 py-5 sm:px-6">
				<div>
					<div class="flex flex-wrap items-center gap-2">
						<Badge variant="outline">{getEventTypeLabel(data.listing.eventType)}</Badge>
						{#if data.listing.isFeatured}
							<Badge class="bg-ink-950 text-mist-100">
								<Sparkles class="mr-1 size-3.5" />
								Featured
							</Badge>
						{/if}
					</div>
					<h1 class="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink-950 sm:text-5xl">
						{data.listing.title}
					</h1>
				</div>
			</div>

			<CardContent class="space-y-5 px-5 py-5 sm:px-6">
				<div class="flex flex-wrap gap-3 text-sm text-ink-700">
					<span class="inline-flex items-center gap-1.5">
						<CalendarDays class="size-4 text-ink-700/60" />
						{formatDateRange(data.listing.startAt, data.listing.endAt)}
					</span>
					<span class="inline-flex items-center gap-1.5">
						<MapPinned class="size-4 text-ink-700/60" />
						{data.listing.locationLabel}
					</span>
					{#if data.listing.priceSummary}
						<span class="inline-flex items-center gap-1.5">
							<Compass class="size-4 text-ink-700/60" />
							{data.listing.priceSummary}
						</span>
					{/if}
				</div>

				<p class="text-base leading-8 text-ink-700">
					{data.listing.description || 'Details are coming soon, but the essentials are already live.'}
				</p>

				{#if data.tags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each data.tags as tag (`${data.listing.id}-${tag}`)}
							<Badge variant="secondary">{tag}</Badge>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<div class="space-y-6">
			<Card class="border-white/80 bg-white/88 backdrop-blur">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
						<Store class="size-5 text-leaf-400" />
						Hosted by {data.host.displayName}
					</CardTitle>
					<CardDescription>
						{data.host.bio || 'Local host with more events worth browsing.'}
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
					{#if data.host.locationLabel}
						<p class="text-sm text-ink-700">Usually active around {data.host.locationLabel}.</p>
					{/if}
					<Button href={`/hosts/${data.host.slug}`} class="w-full rounded-full">View host profile</Button>
				</CardContent>
			</Card>

			<Card class="border-white/80 bg-ink-950 text-mist-100 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.55)]">
				<CardHeader>
					<CardTitle class="font-display text-2xl text-mist-100">Plan your stop</CardTitle>
					<CardDescription class="text-mist-100/75">
						Use the description, location, and host context to decide whether this belongs on your route.
					</CardDescription>
				</CardHeader>
				<CardContent class="px-4 pb-5 text-sm leading-7 text-mist-100/80 sm:px-6">
					Go back to discovery to compare this with nearby sales, or jump into the host profile for more events.
				</CardContent>
			</Card>
		</div>
	</div>

	{#if data.relatedListings.length > 0}
		<section class="space-y-4">
			<div>
				<p class="text-sm font-semibold uppercase tracking-[0.26em] text-ink-700/70">Nearby picks</p>
				<h2 class="mt-2 font-display text-3xl text-ink-950">More worth checking nearby</h2>
			</div>
			<div class="grid gap-4 lg:grid-cols-3">
				{#each data.relatedListings as item (item.listing.id)}
					<Card class="border-white/80 bg-white/88 backdrop-blur">
						<CardHeader>
							<div class="flex flex-wrap items-center gap-2">
								<Badge variant="outline">{getEventTypeLabel(item.listing.eventType)}</Badge>
								{#if item.isSameHost}
									<Badge variant="secondary">Same host</Badge>
								{/if}
							</div>
							<CardTitle class="text-xl text-ink-950">{item.listing.title}</CardTitle>
							<CardDescription>{item.host.displayName}</CardDescription>
						</CardHeader>
						<CardContent class="space-y-3 px-4 pb-5 sm:px-6">
							{#if item.media.length > 0}
								<img src={item.media[0].url} alt={item.media[0].altText || item.listing.title} class="h-40 w-full rounded-2xl object-cover" />
							{/if}
							<p class="text-sm text-ink-700">{item.listing.locationLabel}</p>
							<p class="text-sm leading-6 text-ink-700">
								{item.listing.description || 'Published with the essentials ready to explore.'}
							</p>
							<div class="flex flex-wrap gap-2">
								{#each item.tags.slice(0, 3) as tag (`${item.listing.id}-${tag}`)}
									<Badge variant="secondary">{tag}</Badge>
								{/each}
							</div>
							<Button href={`/sale/${item.listing.slug}`} variant="outline" class="w-full rounded-full">
								Open listing
							</Button>
						</CardContent>
					</Card>
				{/each}
			</div>
		</section>
	{/if}
</section>
