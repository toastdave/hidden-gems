<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { getEventTypeLabel } from '$lib/content/discovery'
import CalendarDays from '@lucide/svelte/icons/calendar-days'
import Home from '@lucide/svelte/icons/house'
import PenSquare from '@lucide/svelte/icons/pen-square'
import Store from '@lucide/svelte/icons/store'
import type { PageData } from './$types'

const { data } = $props<{ data: PageData }>()

const statusTabs = $derived([
	{ value: 'all', label: 'All', count: data.stats.total },
	{ value: 'published', label: 'Published', count: data.stats.published },
	{ value: 'draft', label: 'Drafts', count: data.stats.draft },
	{ value: 'archived', label: 'Archived', count: data.stats.archived },
	{ value: 'cancelled', label: 'Cancelled', count: data.stats.cancelled },
])
</script>

<svelte:head>
	<title>Host Dashboard | Hidden Gems</title>
</svelte:head>

<section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
	<div class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
		<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
			<CardHeader class="gap-3">
				<div class="flex flex-wrap items-center gap-2">
					<Badge class="bg-ink-950 text-mist-100">Host dashboard</Badge>
					{#if data.host.isVerified}
						<Badge variant="outline">Verified host</Badge>
					{/if}
				</div>
				<CardTitle class="font-display text-4xl text-ink-950">
					{data.host.displayName}
				</CardTitle>
				<CardDescription class="max-w-2xl text-base leading-7 text-ink-700">
					{data.host.bio || 'Your profile is live and ready for your first polished local listing.'}
				</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-4 px-4 pb-5 sm:grid-cols-3 sm:px-6">
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">Published</p>
					<p class="mt-2 font-display text-3xl text-ink-950">{data.stats.published}</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">Drafts</p>
					<p class="mt-2 font-display text-3xl text-ink-950">{data.stats.draft}</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.26em] text-ink-700/70">Profile link</p>
					<p class="mt-2 text-sm font-semibold text-ink-950">/hosts/{data.host.slug}</p>
				</div>
			</CardContent>
		</Card>

		<Card class="border-white/80 bg-ink-950 text-mist-100 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.55)]">
			<CardHeader>
				<CardTitle class="font-display text-2xl text-mist-100">What’s next</CardTitle>
				<CardDescription class="text-mist-100/75">
					Keep your host page current, tighten draft listings, and archive finished events once the weekend passes.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3 px-4 pb-5 sm:px-6">
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="text-sm font-semibold text-mist-100">Capture your best upcoming sale</p>
					<p class="mt-2 text-sm leading-6 text-mist-100/75">
						Have the title, date, neighborhood, and standout items ready so the publish flow stays fast.
					</p>
				</div>
				<Button href="/host/listings/new" class="w-full rounded-full">
					<PenSquare class="mr-1 size-4" />
					Create a listing
				</Button>
				<Button href="/host/profile" variant="outline" class="w-full rounded-full">
					Edit host profile
				</Button>
				<Button href={`/hosts/${data.host.slug}`} variant="outline" class="w-full rounded-full">
					View public host page
				</Button>
				<Button href="/" variant="secondary" class="w-full rounded-full">
					See the discovery experience
				</Button>
			</CardContent>
		</Card>
	</div>

	{#if data.deleted}
		<div class="rounded-[1.75rem] border border-leaf-400/20 bg-leaf-400/10 px-5 py-4 text-sm text-ink-950">
			A listing was removed from your dashboard and public discovery.
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
		<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
					<Store class="size-5 text-leaf-400" />
					Your listings
				</CardTitle>
				<CardDescription>
					Filter by status, jump into edits, and keep older events out of your active lineup.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3 px-4 pb-5 sm:px-6">
				<div class="flex flex-wrap gap-2">
					{#each statusTabs as tab (tab.value)}
						<Button
							href={tab.value === 'all' ? '/host' : `/host?status=${tab.value}`}
							variant={data.selectedStatus === tab.value ? 'default' : 'outline'}
							size="sm"
							class="rounded-full"
						>
							{tab.label} ({tab.count})
						</Button>
					{/each}
				</div>

				{#if data.listings.length === 0}
					<div class="rounded-2xl border border-dashed border-ink-950/15 bg-mist-100/70 p-5 text-sm text-ink-700">
						<p class="text-base font-semibold text-ink-950">
							{data.selectedStatus === 'all' ? 'No listings yet.' : `No ${data.selectedStatus} listings right now.`}
						</p>
						<p class="mt-2 leading-7">
							{#if data.selectedStatus === 'all'}
								Your host profile is ready. The next step is publishing your first sale, market, or neighborhood event.
							{:else}
								Switch filters or create a new listing when you have another local stop worth sharing.
							{/if}
						</p>
					</div>
				{:else}
					{#each data.listings as listing (listing.id)}
						<div class="rounded-2xl border border-ink-950/8 bg-white p-4 shadow-sm">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p class="text-lg font-semibold text-ink-950">{listing.title}</p>
									<p class="mt-1 text-sm text-ink-700">{listing.locationLabel}</p>
								</div>
								<Badge variant={listing.status === 'published' ? 'default' : 'outline'}>
									{listing.status}
								</Badge>
							</div>
							<div class="mt-3 flex flex-wrap gap-3 text-sm text-ink-700">
								<span class="inline-flex items-center gap-1.5">
									<CalendarDays class="size-4 text-ink-700/60" />
									{new Date(listing.startAt).toLocaleString()}
								</span>
								<span class="inline-flex items-center gap-1.5">
									<Home class="size-4 text-ink-700/60" />
									{getEventTypeLabel(listing.eventType)}
								</span>
							</div>
							<div class="mt-4 flex flex-wrap gap-2">
								{#if listing.status === 'published'}
									<Button href={`/sale/${listing.slug}`} variant="secondary" size="sm" class="rounded-full">
										View public page
									</Button>
								{/if}
								<Button href={`/host/listings/${listing.id}`} variant="outline" size="sm" class="rounded-full">
									Edit listing
								</Button>
							</div>
						</div>
					{/each}
				{/if}
			</CardContent>
		</Card>

		<Card class="border-white/80 bg-white/88 backdrop-blur">
			<CardHeader>
				<CardTitle class="text-xl text-ink-950">Publishing checklist</CardTitle>
				<CardDescription>Keep the details people care about ready.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4 text-sm text-ink-700">
					<p class="font-semibold text-ink-950">1. Event basics</p>
					<p class="mt-2 leading-6">Title, date, time, and a clear event type.</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4 text-sm text-ink-700">
					<p class="font-semibold text-ink-950">2. Location confidence</p>
					<p class="mt-2 leading-6">Neighborhood, coordinates, and parking or access notes.</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4 text-sm text-ink-700">
					<p class="font-semibold text-ink-950">3. Standout details</p>
					<p class="mt-2 leading-6">What shoppers can actually expect to find when they arrive.</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4 text-sm text-ink-700">
					<p class="font-semibold text-ink-950">4. Lifecycle cleanup</p>
					<p class="mt-2 leading-6">Unpublish, archive, or duplicate old events so your dashboard stays useful.</p>
				</div>
				<Button href="/host/listings/new" variant="outline" class="w-full rounded-full">
					<PenSquare class="mr-1 size-4" />
					Start a new listing
				</Button>
			</CardContent>
		</Card>
	</div>
</section>
