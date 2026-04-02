<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import { resolve } from '$app/paths'
import { authClient } from '$lib/auth-client'
import SearchAlertCard from '$lib/components/alerts/search-alert-card.svelte'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { getEventTypeLabel } from '$lib/content/discovery'
import CalendarDays from '@lucide/svelte/icons/calendar-days'
import Heart from '@lucide/svelte/icons/heart'
import MapPinned from '@lucide/svelte/icons/map-pinned'
import Store from '@lucide/svelte/icons/store'
import UserRound from '@lucide/svelte/icons/user-round'
import Users from '@lucide/svelte/icons/users'
import type { PageData } from './$types'

const { data } = $props<{ data: PageData }>()

let errorMessage = $state('')
let isSigningOut = $state(false)

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

	return end
		? `${dateFormatter.format(start)} · ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`
		: `${dateFormatter.format(start)} · ${timeFormatter.format(start)}`
}

function formatSavedAt(value: string | Date) {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
	}).format(new Date(value))
}

async function signOut() {
	isSigningOut = true
	errorMessage = ''

	const result = await authClient.signOut()

	isSigningOut = false

	if (result.error) {
		errorMessage = result.error.message ?? 'Unable to sign out right now.'
		return
	}

	await invalidateAll()
	await goto(resolve('/'))
}
</script>

<svelte:head>
	<title>Account | Hidden Gems</title>
</svelte:head>

<section class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
		<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
			<CardHeader class="gap-3">
				<Badge class="bg-ink-950 text-mist-100">Account</Badge>
				<CardTitle class="font-display text-4xl text-ink-950">Hi, {data.user.name}.</CardTitle>
				<CardDescription class="max-w-2xl text-base leading-7 text-ink-700">
					Your account now keeps saved finds and followed hosts in one place while you decide where
					to browse next or when to start publishing.
				</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-4 px-4 pb-5 sm:grid-cols-2 sm:px-6">
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Email</p>
					<p class="mt-2 text-sm font-semibold text-ink-950">{data.user.email}</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Status</p>
					<p class="mt-2 text-sm font-semibold text-ink-950">
						{data.user.emailVerified ? 'Email verified' : 'Verify your email soon'}
					</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Saved listings</p>
					<p class="mt-2 text-2xl font-display text-ink-950">{data.favoriteListings.length}</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Saved searches</p>
					<p class="mt-2 text-2xl font-display text-ink-950">{data.searchAlerts.length}</p>
				</div>
			</CardContent>
		</Card>

		<Card class="border-white/80 bg-ink-950 text-mist-100 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.55)]">
			<CardHeader>
				<CardTitle class="font-display text-2xl text-mist-100">Your next move</CardTitle>
				<CardDescription class="text-mist-100/75">
					{#if data.host}
						Your host profile is ready. Keep browsing, save the strongest finds, or jump back into your dashboard.
					{:else}
						Keep building saved finds now, then create a host profile when you are ready to publish your own events.
					{/if}
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-mist-100/80">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<UserRound class="size-4" />
						Account ready
					</p>
					<p class="mt-2 leading-6">Your saved listings and followed hosts now stay with you across sessions.</p>
				</div>
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-mist-100/80">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<Store class="size-4" />
						Hosting path
					</p>
					<p class="mt-2 leading-6">
						{#if data.host}
							Your public host identity is live at /hosts/{data.host.slug}.
						{:else}
							Set up a recognizable host name so shoppers trust what they are clicking into.
						{/if}
					</p>
				</div>
				<Button href={data.host ? '/host' : '/host/onboarding'} class="w-full rounded-full">
					{data.host ? 'Open host dashboard' : 'Create host profile'}
				</Button>
				<Button href="/" variant="secondary" class="w-full rounded-full">Back to discovery</Button>
				<Button
					variant="outline"
					class="w-full rounded-full border-white/20 bg-transparent text-mist-100 hover:bg-white/8 hover:text-mist-100"
					disabled={isSigningOut}
					onclick={signOut}
					type="button"
				>
					{isSigningOut ? 'Signing out...' : 'Sign out'}
				</Button>

				{#if errorMessage}
					<p class="rounded-2xl border border-coral-500/20 bg-coral-500/10 px-4 py-3 text-sm text-coral-200">
						{errorMessage}
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	<div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
		<Card class="border-white/80 bg-white/88 backdrop-blur">
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-2xl text-ink-950">
					<Heart class="size-5 text-coral-500" />
					Saved listings
				</CardTitle>
				<CardDescription>
					Keep the stops you want to revisit without re-running the same search.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
				{#if data.favoriteListings.length === 0}
					<div class="rounded-2xl border border-dashed border-ink-950/12 bg-mist-100/70 p-5 text-sm leading-6 text-ink-700">
						<p class="text-base font-semibold text-ink-950">No saved listings yet.</p>
						<p class="mt-2">Save from discovery cards or a listing page and your picks will land here.</p>
					</div>
				{:else}
					<div class="grid gap-4 lg:grid-cols-2">
						{#each data.favoriteListings as item (item.listing.id)}
							<div class="overflow-hidden rounded-[1.5rem] border border-ink-950/8 bg-white shadow-sm">
								{#if item.coverMedia}
									<img
										src={item.coverMedia.url}
										alt={item.coverMedia.altText || item.listing.title}
										class="h-44 w-full object-cover"
									/>
								{/if}
								<div class="space-y-4 p-4">
									<div class="flex flex-wrap items-center gap-2">
										<Badge variant="outline">{getEventTypeLabel(item.listing.eventType)}</Badge>
										<Badge variant="secondary">Saved {formatSavedAt(item.savedAt)}</Badge>
									</div>
									<div>
										<p class="text-sm font-semibold text-ink-700">{item.host.displayName}</p>
										<h2 class="mt-1 text-xl font-semibold text-ink-950">{item.listing.title}</h2>
									</div>
									<p class="text-sm leading-6 text-ink-700">
										{item.listing.description || 'Published with the essentials ready for your next route.'}
									</p>
									<div class="space-y-2 text-sm text-ink-700">
										<p class="inline-flex items-center gap-1.5">
											<CalendarDays class="size-4 text-ink-700/60" />
											{formatDateRange(item.listing.startAt, item.listing.endAt)}
										</p>
										<p class="inline-flex items-center gap-1.5">
											<MapPinned class="size-4 text-ink-700/60" />
											{item.listing.locationLabel}
										</p>
									</div>
									{#if item.tags.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each item.tags as tag (`${item.listing.id}-${tag}`)}
												<Badge variant="secondary">{tag}</Badge>
											{/each}
										</div>
									{/if}
									<div class="flex flex-wrap gap-2">
										<Button href={`/sale/${item.listing.slug}`} class="rounded-full">Open listing</Button>
										<Button href={`/hosts/${item.host.slug}`} variant="outline" class="rounded-full">
											View host
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<div class="space-y-6">
			<Card class="border-white/80 bg-white/88 backdrop-blur">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-2xl text-ink-950">
						<CalendarDays class="size-5 text-ink-950" />
						Saved searches
					</CardTitle>
					<CardDescription>
						Keep the best discovery setups ready while email delivery and notification preferences come next.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
					{#if data.searchAlerts.length === 0}
						<div class="rounded-2xl border border-dashed border-ink-950/12 bg-mist-100/70 p-5 text-sm leading-6 text-ink-700">
							<p class="text-base font-semibold text-ink-950">No saved searches yet.</p>
							<p class="mt-2">Save a search from discovery and it will show up here with pause and delete controls.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each data.searchAlerts as alert (alert.id)}
								<SearchAlertCard {alert} />
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<Card class="border-white/80 bg-white/88 backdrop-blur">
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-2xl text-ink-950">
					<Users class="size-5 text-leaf-400" />
					Followed hosts
				</CardTitle>
				<CardDescription>
					Keep tabs on the sellers and organizers you want to check again.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
				{#if data.followedHosts.length === 0}
					<div class="rounded-2xl border border-dashed border-ink-950/12 bg-mist-100/70 p-5 text-sm leading-6 text-ink-700">
						<p class="text-base font-semibold text-ink-950">No followed hosts yet.</p>
						<p class="mt-2">Follow a host from a listing page or host profile and you will see them here.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.followedHosts as item (item.host.id)}
							<div class="rounded-[1.5rem] border border-ink-950/8 bg-white p-4 shadow-sm">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div>
										<div class="flex flex-wrap items-center gap-2">
											<p class="text-xl font-semibold text-ink-950">{item.host.displayName}</p>
											{#if item.host.isVerified}
												<Badge variant="outline">Verified host</Badge>
											{/if}
										</div>
										<p class="mt-2 text-sm leading-6 text-ink-700">
											{item.host.bio || 'Local host with more events worth tracking.'}
										</p>
									</div>
									<Badge variant="secondary">Followed {formatSavedAt(item.followedAt)}</Badge>
								</div>

								<div class="mt-4 space-y-2 text-sm text-ink-700">
									{#if item.host.locationLabel}
										<p class="inline-flex items-center gap-1.5">
											<MapPinned class="size-4 text-ink-700/60" />
											Usually active around {item.host.locationLabel}
										</p>
									{/if}
									<p>{item.publishedListingsCount} published listing{item.publishedListingsCount === 1 ? '' : 's'}</p>
									{#if item.nextListing}
										<p class="text-ink-950">Next stop: {item.nextListing.title}</p>
									{/if}
								</div>

								<div class="mt-4 flex flex-wrap gap-2">
									<Button href={`/hosts/${item.host.slug}`} class="rounded-full">Open host</Button>
									{#if item.nextListing}
										<Button href={`/sale/${item.nextListing.slug}`} variant="outline" class="rounded-full">
											Open next listing
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
			</Card>
		</div>
	</div>
</section>
