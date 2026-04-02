<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import type { NotificationPreferenceSettings } from '$lib/server/search-alerts'
import BellRing from '@lucide/svelte/icons/bell-ring'

const { preference }: { preference: NotificationPreferenceSettings } = $props()

let localPreference = $state<NotificationPreferenceSettings>({
	searchAlertsEnabled: true,
	searchAlertCadence: 'daily',
})
let isPending = $state(false)
let requestError = $state('')

$effect(() => {
	localPreference = preference
})

async function updatePreference(nextPreference: NotificationPreferenceSettings) {
	if (isPending) {
		return
	}

	isPending = true
	requestError = ''

	const response = await fetch('/api/notification-preferences', {
		method: 'PATCH',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(nextPreference),
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok || !payload?.ok) {
		requestError = payload?.message ?? 'Unable to update alert preferences right now.'
		isPending = false
		return
	}

	localPreference = payload.preference
	isPending = false
	await invalidateAll()
}
</script>

<Card class="border-white/80 bg-white/88 backdrop-blur">
	<CardHeader>
		<div class="flex flex-wrap items-center gap-2">
			<CardTitle class="flex items-center gap-2 text-2xl text-ink-950">
				<BellRing class="size-5 text-coral-500" />
				Alert preferences
			</CardTitle>
			<Badge variant={localPreference.searchAlertsEnabled ? 'secondary' : 'outline'}>
				{localPreference.searchAlertsEnabled ? 'Enabled' : 'Paused'}
			</Badge>
		</div>
		<CardDescription>
			Choose how often saved searches should create new account alerts when fresh listings match.
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
		<div class="flex flex-wrap gap-2">
			<Button
				type="button"
				variant={localPreference.searchAlertsEnabled ? 'default' : 'outline'}
				class="rounded-full"
				disabled={isPending}
				onclick={() =>
					updatePreference({
						...localPreference,
						searchAlertsEnabled: true,
					})}
			>
				Enable alerts
			</Button>
			<Button
				type="button"
				variant={!localPreference.searchAlertsEnabled ? 'secondary' : 'outline'}
				class="rounded-full"
				disabled={isPending}
				onclick={() =>
					updatePreference({
						...localPreference,
						searchAlertsEnabled: false,
					})}
			>
				Pause all alerts
			</Button>
		</div>

		<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
			<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Delivery cadence</p>
			<div class="mt-3 flex flex-wrap gap-2">
				<Button
					type="button"
					variant={localPreference.searchAlertCadence === 'instant' ? 'default' : 'outline'}
					class="rounded-full"
					disabled={isPending}
					onclick={() =>
						updatePreference({
							...localPreference,
							searchAlertCadence: 'instant',
						})}
				>
					Instant
				</Button>
				<Button
					type="button"
					variant={localPreference.searchAlertCadence === 'daily' ? 'default' : 'outline'}
					class="rounded-full"
					disabled={isPending}
					onclick={() =>
						updatePreference({
							...localPreference,
							searchAlertCadence: 'daily',
						})}
				>
					Daily digest
				</Button>
			</div>
			<p class="mt-3 text-sm leading-6 text-ink-700">
				Instant checks every delivery run for fresh matches. Daily digest waits until at least one day has passed before checking again.
			</p>
		</div>

		<span class="sr-only" aria-live="polite">{requestError}</span>
	</CardContent>
</Card>
