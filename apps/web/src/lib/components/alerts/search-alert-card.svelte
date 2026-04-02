<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { type DiscoveryEventType, formatTagLabel, getEventTypeLabel } from '$lib/content/discovery'
import type { SearchAlertRecord } from '$lib/server/search-alerts'
import Bell from '@lucide/svelte/icons/bell'
import MapPinned from '@lucide/svelte/icons/map-pinned'
import Trash2 from '@lucide/svelte/icons/trash-2'

const { alert }: { alert: SearchAlertRecord } = $props()

let activeOverride = $state<boolean | null>(null)
let isPending = $state(false)
let isRemoving = $state(false)
let requestError = $state('')

const isActive = $derived(activeOverride ?? alert.isActive)

function formatTimestamp(value: string | Date | null) {
	if (!value) {
		return 'Not delivered yet'
	}

	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(value))
}

async function updateActiveState(nextValue: boolean) {
	if (isPending || isRemoving) {
		return
	}

	isPending = true
	requestError = ''

	const response = await fetch(`/api/search-alerts/${alert.id}`, {
		method: 'PATCH',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify({ isActive: nextValue }),
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok || !payload?.ok) {
		requestError = payload?.message ?? 'Unable to update this saved search right now.'
		isPending = false
		return
	}

	activeOverride = payload.isActive
	isPending = false
	await invalidateAll()
}

async function removeAlert() {
	if (isPending || isRemoving) {
		return
	}

	isRemoving = true
	requestError = ''

	const response = await fetch(`/api/search-alerts/${alert.id}`, {
		method: 'DELETE',
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok || !payload?.ok) {
		requestError = payload?.message ?? 'Unable to delete this saved search right now.'
		isRemoving = false
		return
	}

	await invalidateAll()
}
</script>

<div class="rounded-[1.5rem] border border-ink-950/8 bg-white p-4 shadow-sm">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<div class="flex flex-wrap items-center gap-2">
				<p class="text-lg font-semibold text-ink-950">{alert.label}</p>
				<Badge variant={isActive ? 'secondary' : 'outline'}>{isActive ? 'Active' : 'Paused'}</Badge>
				<Badge variant="outline">{alert.cadence === 'instant' ? 'Instant' : 'Daily digest'}</Badge>
			</div>
			<p class="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-700">
				<MapPinned class="size-4 text-ink-700/60" />
				{alert.locationLabel}
			</p>
		</div>
		<Badge variant="outline">Within {alert.radiusMiles} mi</Badge>
	</div>

	<div class="mt-4 flex flex-wrap gap-2">
		{#if (alert.eventTypes ?? []).length === 0}
			<Badge variant="secondary">All events</Badge>
		{:else}
			{#each alert.eventTypes ?? [] as eventType (`${alert.id}-${eventType}`)}
				<Badge variant="secondary">{getEventTypeLabel(eventType as DiscoveryEventType)}</Badge>
			{/each}
		{/if}

		{#each alert.tags ?? [] as tag (`${alert.id}-${tag}`)}
			<Badge variant="secondary">{formatTagLabel(tag)}</Badge>
		{/each}
	</div>

	<div class="mt-4 rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4 text-sm leading-6 text-ink-700">
		<p>Last delivery: {formatTimestamp(alert.lastDeliveredAt)}</p>
		<p class="mt-1">Last checked: {formatTimestamp(alert.lastCheckedAt)}</p>
	</div>

	<div class="mt-4 flex flex-wrap gap-2">
		<Button type="button" variant="outline" class="rounded-full" disabled={isPending || isRemoving} onclick={() => updateActiveState(!isActive)}>
			<Bell class="size-4" />
			{#if isPending}
				Updating...
			{:else}
				{isActive ? 'Pause search' : 'Resume search'}
			{/if}
		</Button>
		<Button type="button" variant="outline" class="rounded-full" disabled={isPending || isRemoving} onclick={removeAlert}>
			<Trash2 class="size-4" />
			{isRemoving ? 'Removing...' : 'Delete'}
		</Button>
	</div>

	<span class="sr-only" aria-live="polite">{requestError}</span>
</div>
