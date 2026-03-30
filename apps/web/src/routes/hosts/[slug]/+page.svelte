<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { getEventTypeLabel } from '$lib/content/discovery'
import CalendarDays from '@lucide/svelte/icons/calendar-days'
import MapPinned from '@lucide/svelte/icons/map-pinned'
import Sparkles from '@lucide/svelte/icons/sparkles'
import type { PageData } from './$types'

const { data } = $props<{ data: PageData }>()
const tagsByListingId = $derived(
	new Map<string, string[]>(
		data.listingTags.map((entry: PageData['listingTags'][number]) => [entry.listingId, entry.tags])
	)
)

function formatDateRange(startAt: string | Date, endAt?: string | Date | null) {
	const start = new Date(startAt)
	const end = endAt ? new Date(endAt) : null
	const dateFormatter = new Intl.DateTimeFormat('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	})
	const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
	const datePart = dateFormatter.format(start)

	return end
		? `${datePart} · ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`
		: `${datePart} · ${timeFormatter.format(start)}`
}
</script>

<svelte:head>
	<title>{data.host.displayName} | Hidden Gems</title>
	<meta name="description" content={data.host.bio || `${data.host.displayName} on Hidden Gems`} />
</svelte:head>

<section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
	<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
		<CardHeader class="gap-3">
			<div class="flex flex-wrap items-center gap-2">
				<Badge class="bg-ink-950 text-mist-100">Host profile</Badge>
				{#if data.host.isVerified}
					<Badge variant="outline">Verified host</Badge>
				{/if}
			</div>
			<CardTitle class="font-display text-4xl text-ink-950 sm:text-5xl">{data.host.displayName}</CardTitle>
			<CardDescription class="max-w-3xl text-base leading-7 text-ink-700">
				{data.host.bio || 'Local host with upcoming events worth tracking.'}
			</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-wrap gap-3 px-4 pb-5 text-sm text-ink-700 sm:px-6">
			{#if data.host.locationLabel}
				<span class="inline-flex items-center gap-1.5">
					<MapPinned class="size-4 text-ink-700/60" />
					Usually active around {data.host.locationLabel}
				</span>
			{/if}
			<span>{data.listings.length} published listing{data.listings.length === 1 ? '' : 's'}</span>
		</CardContent>
	</Card>

	<div class="grid gap-4 lg:grid-cols-2">
		{#if data.listings.length === 0}
			<Card class="border-white/80 bg-white/88 backdrop-blur lg:col-span-2">
				<CardContent class="px-4 py-8 text-sm text-ink-700 sm:px-6">
					This host profile is live, but no public listings are up yet.
				</CardContent>
			</Card>
		{:else}
			{#each data.listings as listing}
				<Card class="border-white/80 bg-white/88 backdrop-blur">
					<CardHeader>
						<div class="flex flex-wrap items-center gap-2">
							<Badge variant="outline">{getEventTypeLabel(listing.eventType)}</Badge>
							{#if listing.isFeatured}
								<Badge class="bg-ink-950 text-mist-100">
									<Sparkles class="mr-1 size-3.5" />
									Featured
								</Badge>
							{/if}
						</div>
						<CardTitle class="text-2xl text-ink-950">{listing.title}</CardTitle>
						<CardDescription>{listing.locationLabel}</CardDescription>
					</CardHeader>
					<CardContent class="space-y-3 px-4 pb-5 sm:px-6">
						<div class="flex flex-wrap gap-3 text-sm text-ink-700">
							<span class="inline-flex items-center gap-1.5">
								<CalendarDays class="size-4 text-ink-700/60" />
								{formatDateRange(listing.startAt, listing.endAt)}
							</span>
						</div>
						<p class="text-sm leading-6 text-ink-700">
							{listing.description || 'Published with the essentials ready for discovery.'}
						</p>
						<div class="flex flex-wrap gap-2">
							{#each tagsByListingId.get(listing.id) ?? [] as tag}
								<Badge variant="secondary">{tag}</Badge>
							{/each}
						</div>
						<Button href={`/sale/${listing.slug}`} variant="outline" class="w-full rounded-full">
							Open listing
						</Button>
					</CardContent>
				</Card>
			{/each}
		{/if}
	</div>
</section>
